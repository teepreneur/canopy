package alerts

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/teepreneur/canopy/agent-go/internal/config"
)

const rateLimitSec = 60

var suspiciousKeywords = []string{
	"vpn", "proxy", "unblock", "bypass", "tor browser",
	"hide browsing", "anonymous", "incognito",
}

type Manager struct {
	cfg          *config.AgentConfig
	mu           sync.Mutex
	recentAlerts map[string]time.Time
	blockedCount map[string]int
}

func New(cfg *config.AgentConfig) *Manager {
	return &Manager{
		cfg:          cfg,
		recentAlerts: make(map[string]time.Time),
		blockedCount: make(map[string]int),
	}
}

func (m *Manager) SendAlert(alertType, detail string) {
	m.mu.Lock()
	key := alertType + ":" + detail
	if last, ok := m.recentAlerts[key]; ok && time.Since(last) < rateLimitSec*time.Second {
		m.mu.Unlock()
		return
	}
	m.recentAlerts[key] = time.Now()
	m.cleanupOld()
	m.mu.Unlock()

	payload := map[string]string{
		"alert_type": alertType,
		"title":      fmt.Sprintf("%s: %.100s", alertType, detail),
		"detail":     detail,
		"target":     detail,
	}
	body, _ := json.Marshal(payload)
	url := fmt.Sprintf("%s/api/v1/alerts/submit/%s", m.cfg.BackendURL, m.cfg.DeviceID)
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Device-Token", m.cfg.DeviceToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		slog.Warn("Alert send failed", "err", err)
		return
	}
	resp.Body.Close()
	slog.Info("Alert sent", "type", alertType, "detail", detail)
}

func (m *Manager) RecordBlockedAccess(target string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.blockedCount[target]++
	if m.blockedCount[target] >= 5 {
		m.blockedCount[target] = 0
		go m.SendAlert("blocked_attempt", fmt.Sprintf("Repeated access to %s", target))
	}
}

func (m *Manager) CheckWindowTitle(title string) {
	lower := strings.ToLower(title)
	for _, kw := range suspiciousKeywords {
		if strings.Contains(lower, kw) {
			go m.SendAlert("suspicious_activity", fmt.Sprintf("Window title contains '%s': %s", kw, title))
			return
		}
	}
}

func (m *Manager) CheckRapidSwitching(switches []time.Time) {
	if len(switches) >= 10 {
		go m.SendAlert("suspicious_activity", fmt.Sprintf("Rapid app switching: %d switches in 30s", len(switches)))
	}
}

func (m *Manager) cleanupOld() {
	cutoff := time.Now().Add(-5 * rateLimitSec * time.Second)
	for k, v := range m.recentAlerts {
		if v.Before(cutoff) {
			delete(m.recentAlerts, k)
		}
	}
}
