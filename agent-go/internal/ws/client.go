package ws

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/teepreneur/canopy/agent-go/internal/config"
)

const (
	maxBackoff     = 120 * time.Second
	initialBackoff = 1 * time.Second
)

type Handler func(msg map[string]any)

type Client struct {
	cfg      *config.AgentConfig
	mu       sync.Mutex
	conn     *websocket.Conn
	handlers map[string][]Handler
	cancel   context.CancelFunc
	connected bool
}

func New(cfg *config.AgentConfig) *Client {
	return &Client{
		cfg:      cfg,
		handlers: make(map[string][]Handler),
	}
}

func (c *Client) On(eventType string, h Handler) {
	c.handlers[eventType] = append(c.handlers[eventType], h)
}

func (c *Client) IsConnected() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.connected
}

func (c *Client) Start(ctx context.Context) {
	ctx, c.cancel = context.WithCancel(ctx)
	go c.connectionLoop(ctx)
}

func (c *Client) Stop() {
	if c.cancel != nil {
		c.cancel()
	}
	c.mu.Lock()
	if c.conn != nil {
		c.conn.Close()
	}
	c.mu.Unlock()
}

func (c *Client) Send(msg map[string]any) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.conn == nil || !c.connected {
		return fmt.Errorf("not connected")
	}
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	return c.conn.WriteMessage(websocket.TextMessage, data)
}

func (c *Client) connectionLoop(ctx context.Context) {
	backoff := initialBackoff
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		url := fmt.Sprintf("%s/ws/agent/%s?token=%s", c.cfg.WsURL, c.cfg.DeviceID, c.cfg.DeviceToken)
		conn, _, err := websocket.DefaultDialer.DialContext(ctx, url, nil)
		if err != nil {
			slog.Warn("WebSocket connect error", "err", err)
			select {
			case <-ctx.Done():
				return
			case <-time.After(backoff):
			}
			backoff = min(backoff*2, maxBackoff)
			continue
		}

		c.mu.Lock()
		c.conn = conn
		c.connected = true
		c.mu.Unlock()
		backoff = initialBackoff
		slog.Info("WebSocket connected")

		hbCtx, hbCancel := context.WithCancel(ctx)
		go c.heartbeatLoop(hbCtx)

		c.readLoop(conn)
		hbCancel()

		c.mu.Lock()
		c.connected = false
		c.conn = nil
		c.mu.Unlock()

		if ctx.Err() != nil {
			return
		}
		slog.Info("Reconnecting", "backoff_s", backoff.Seconds())
		select {
		case <-ctx.Done():
			return
		case <-time.After(backoff):
		}
		backoff = min(backoff*2, maxBackoff)
	}
}

func (c *Client) readLoop(conn *websocket.Conn) {
	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			slog.Warn("WebSocket read error", "err", err)
			return
		}
		var msg map[string]any
		if err := json.Unmarshal(data, &msg); err != nil {
			slog.Warn("Invalid WebSocket message")
			continue
		}
		msgType, _ := msg["type"].(string)
		slog.Debug("WS received", "type", msgType)

		handlers := c.handlers[msgType]
		handlers = append(handlers, c.handlers["*"]...)
		for _, h := range handlers {
			h(msg)
		}
	}
}

func (c *Client) heartbeatLoop(ctx context.Context) {
	ticker := time.NewTicker(time.Duration(c.cfg.HeartbeatInterval) * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			_ = c.Send(map[string]any{
				"type":      "heartbeat",
				"timestamp": float64(time.Now().Unix()),
			})
		}
	}
}
