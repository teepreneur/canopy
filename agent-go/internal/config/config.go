package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

var configDir = filepath.Join(os.Getenv("HOME"), "Library", "Application Support", "Canopy")

func ConfigDir() string { return configDir }

type AgentConfig struct {
	BackendURL             string `json:"backend_url"`
	WsURL                  string `json:"ws_url"`
	DeviceID               string `json:"device_id"`
	DeviceToken            string `json:"device_token"`
	FamilyID               string `json:"family_id"`
	ChildProfileID         string `json:"child_profile_id"`
	DNSPort                int    `json:"dns_port"`
	BlockedPagePort        int    `json:"blocked_page_port"`
	HeartbeatInterval      int    `json:"heartbeat_interval"`
	ActivityUploadInterval int    `json:"activity_upload_interval"`
	KillSwitchTimeout      int    `json:"kill_switch_timeout"`
}

func DefaultConfig() *AgentConfig {
	return &AgentConfig{
		BackendURL:             "http://localhost:8000",
		WsURL:                  "ws://localhost:8000",
		DNSPort:                5354,
		BlockedPagePort:        8853,
		HeartbeatInterval:      30,
		ActivityUploadInterval: 300,
		KillSwitchTimeout:      14400,
	}
}

func (c *AgentConfig) IsRegistered() bool {
	return c.DeviceID != "" && c.DeviceToken != ""
}

func (c *AgentConfig) Save() error {
	if err := os.MkdirAll(configDir, 0700); err != nil {
		return err
	}
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}
	p := filepath.Join(configDir, "config.json")
	return os.WriteFile(p, data, 0600)
}

func LoadConfig() *AgentConfig {
	cfg := DefaultConfig()
	p := filepath.Join(configDir, "config.json")
	data, err := os.ReadFile(p)
	if err != nil {
		return cfg
	}
	_ = json.Unmarshal(data, cfg)
	return cfg
}

type Rules struct {
	mu             sync.RWMutex
	BlockedDomains []string               `json:"blocked_domains"`
	BlockedApps    []string               `json:"blocked_apps"`
	Schedules      []map[string]any       `json:"schedules"`
}

func NewRules() *Rules {
	return &Rules{}
}

func (r *Rules) Save() error {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if err := os.MkdirAll(configDir, 0700); err != nil {
		return err
	}
	data, err := json.MarshalIndent(r, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(configDir, "rules.json"), data, 0644)
}

func LoadRules() *Rules {
	rules := NewRules()
	p := filepath.Join(configDir, "rules.json")
	data, err := os.ReadFile(p)
	if err != nil {
		return rules
	}
	_ = json.Unmarshal(data, rules)
	return rules
}

func (r *Rules) IsDomainBlocked(domain string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	domain = strings.ToLower(strings.TrimRight(domain, "."))
	for _, pattern := range r.BlockedDomains {
		pattern = strings.ToLower(strings.TrimRight(pattern, "."))
		if strings.HasPrefix(pattern, "*.") {
			suffix := pattern[2:]
			if domain == suffix || strings.HasSuffix(domain, "."+suffix) {
				return true
			}
		} else if domain == pattern {
			return true
		}
	}
	return false
}

func (r *Rules) IsAppBlocked(bundleOrName string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	check := strings.ToLower(bundleOrName)
	for _, b := range r.BlockedApps {
		if strings.ToLower(b) == check {
			return true
		}
	}
	return false
}

func (r *Rules) SetDomains(domains []string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.BlockedDomains = domains
}

func (r *Rules) SetApps(apps []string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.BlockedApps = apps
}

func (r *Rules) SetSchedules(schedules []map[string]any) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.Schedules = schedules
}

func (r *Rules) AddApp(app string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, a := range r.BlockedApps {
		if strings.EqualFold(a, app) {
			return
		}
	}
	r.BlockedApps = append(r.BlockedApps, app)
}

func (r *Rules) RemoveApp(app string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	filtered := r.BlockedApps[:0]
	for _, a := range r.BlockedApps {
		if !strings.EqualFold(a, app) {
			filtered = append(filtered, a)
		}
	}
	r.BlockedApps = filtered
}
