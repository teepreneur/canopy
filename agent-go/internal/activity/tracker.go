package activity

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/teepreneur/canopy/agent-go/internal/config"
)

type session struct {
	AppName     string
	BundleID    string
	WindowTitle string
	StartTime   time.Time
	EndTime     time.Time
	DNSQueries  []string
}

type Tracker struct {
	cfg        *config.AgentConfig
	mu         sync.Mutex
	sessions   []session
	currentApp string
	current    *session
	cancel     context.CancelFunc
}

func New(cfg *config.AgentConfig) *Tracker {
	return &Tracker{cfg: cfg}
}

func (t *Tracker) RecordDNSQuery(domain string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	if t.current != nil {
		t.current.DNSQueries = append(t.current.DNSQueries, domain)
	}
}

func (t *Tracker) Start(ctx context.Context) {
	ctx, t.cancel = context.WithCancel(ctx)
	go t.trackWindow(ctx)
	go t.uploadLoop(ctx)
	slog.Info("Activity tracker started")
}

func (t *Tracker) Stop() {
	if t.cancel != nil {
		t.cancel()
	}
	t.closeSession()
	t.uploadBatch()
}

func (t *Tracker) trackWindow(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			name, title, bundle := getActiveWindow()
			t.mu.Lock()
			if name != t.currentApp {
				t.closeCurrent()
				t.currentApp = name
				t.current = &session{
					AppName:     name,
					BundleID:    bundle,
					WindowTitle: title,
					StartTime:   time.Now(),
				}
			} else if t.current != nil {
				t.current.WindowTitle = title
			}
			t.mu.Unlock()
		}
	}
}

func (t *Tracker) closeCurrent() {
	if t.current != nil {
		t.current.EndTime = time.Now()
		if t.current.EndTime.Sub(t.current.StartTime) > 2*time.Second {
			t.sessions = append(t.sessions, *t.current)
		}
		t.current = nil
	}
}

func (t *Tracker) closeSession() {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.closeCurrent()
}

func (t *Tracker) uploadLoop(ctx context.Context) {
	ticker := time.NewTicker(time.Duration(t.cfg.ActivityUploadInterval) * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			t.uploadBatch()
		}
	}
}

func (t *Tracker) uploadBatch() {
	t.mu.Lock()
	if len(t.sessions) == 0 {
		t.mu.Unlock()
		return
	}
	batch := make([]session, len(t.sessions))
	copy(batch, t.sessions)
	t.sessions = t.sessions[:0]
	t.mu.Unlock()

	type entry struct {
		ActivityType    string  `json:"activity_type"`
		Target          string  `json:"target"`
		Title           *string `json:"title"`
		DurationSeconds int     `json:"duration_seconds"`
		Timestamp       string  `json:"timestamp"`
	}

	var entries []entry
	for _, s := range batch {
		dur := int(s.EndTime.Sub(s.StartTime).Seconds())
		ts := s.StartTime.UTC().Format(time.RFC3339)
		target := s.BundleID
		if target == "" {
			target = s.AppName
		}
		title := s.WindowTitle
		entries = append(entries, entry{
			ActivityType:    "app_usage",
			Target:          target,
			Title:           &title,
			DurationSeconds: dur,
			Timestamp:       ts,
		})
		for i, domain := range s.DNSQueries {
			if i >= 10 {
				break
			}
			entries = append(entries, entry{
				ActivityType:    "site_visit",
				Target:          domain,
				Title:           nil,
				DurationSeconds: 0,
				Timestamp:       ts,
			})
		}
	}

	body, _ := json.Marshal(map[string]any{"entries": entries})
	url := fmt.Sprintf("%s/api/v1/activity/submit/%s", t.cfg.BackendURL, t.cfg.DeviceID)
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		slog.Warn("Activity upload request error", "err", err)
		t.requeue(batch)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Device-Token", t.cfg.DeviceToken)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		slog.Warn("Activity upload failed", "err", err)
		t.requeue(batch)
		return
	}
	resp.Body.Close()
	if resp.StatusCode >= 300 {
		slog.Warn("Activity upload status", "code", resp.StatusCode)
		t.requeue(batch)
		return
	}
	slog.Info("Uploaded activity", "sessions", len(batch))
}

func (t *Tracker) requeue(batch []session) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.sessions = append(batch, t.sessions...)
}

func getActiveWindow() (name, title, bundleID string) {
	out, err := exec.Command("osascript", "-e",
		`tell application "System Events" to get {name, bundle identifier} of first process whose frontmost is true`).
		Output()
	if err != nil {
		return
	}
	parts := strings.SplitN(strings.TrimSpace(string(out)), ", ", 2)
	if len(parts) >= 1 {
		name = parts[0]
	}
	if len(parts) >= 2 {
		bundleID = parts[1]
	}

	titleOut, err := exec.Command("osascript", "-e",
		`tell application "System Events" to get title of first window of first process whose frontmost is true`).
		Output()
	if err == nil {
		title = strings.TrimSpace(string(titleOut))
	}
	return
}
