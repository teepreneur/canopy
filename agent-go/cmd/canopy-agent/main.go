package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/teepreneur/canopy/agent-go/internal/activity"
	"github.com/teepreneur/canopy/agent-go/internal/alerts"
	"github.com/teepreneur/canopy/agent-go/internal/applock"
	"github.com/teepreneur/canopy/agent-go/internal/blocked"
	"github.com/teepreneur/canopy/agent-go/internal/config"
	"github.com/teepreneur/canopy/agent-go/internal/dns"
	"github.com/teepreneur/canopy/agent-go/internal/killswitch"
	"github.com/teepreneur/canopy/agent-go/internal/setup"
	"github.com/teepreneur/canopy/agent-go/internal/ws"
)

const version = "0.1.0"

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	switch os.Args[1] {
	case "setup":
		setup.RunWizard()
	case "run":
		verbose := false
		for _, arg := range os.Args[2:] {
			if arg == "-v" || arg == "--verbose" {
				verbose = true
			}
		}
		runAgent(verbose)
	case "version":
		fmt.Printf("canopy-agent %s\n", version)
	default:
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println("Canopy macOS Device Agent")
	fmt.Println()
	fmt.Println("Usage:")
	fmt.Println("  canopy-agent setup     Register this device with Canopy")
	fmt.Println("  canopy-agent run [-v]  Start the agent")
	fmt.Println("  canopy-agent version   Print version")
}

func runAgent(verbose bool) {
	level := slog.LevelInfo
	if verbose {
		level = slog.LevelDebug
	}
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: level})))

	cfg := config.LoadConfig()
	rules := config.LoadRules()

	slog.Info("Starting Canopy agent", "version", version, "device", cfg.DeviceID)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	blockedSrv := blocked.NewServer(cfg.BlockedPagePort)
	dnsSrv := dns.NewBlocker(rules, cfg.DNSPort)
	appLocker := applock.New(rules)
	actTracker := activity.New(cfg)
	ks := killswitch.New(cfg)
	alertMgr := alerts.New(cfg)
	wsClient := ws.New(cfg)

	// Wire DNS callbacks
	dnsSrv.OnQuery(actTracker.RecordDNSQuery)
	dnsSrv.OnBlocked(func(domain string) {
		alertMgr.RecordBlockedAccess(domain)
		go alertMgr.SendAlert("blocked_attempt", domain)
	})

	// Wire app locker callbacks
	appLocker.OnBlocked(func(name, bundleID string) {
		alertMgr.RecordBlockedAccess(bundleID)
		go alertMgr.SendAlert("blocked_attempt", fmt.Sprintf("%s (%s)", name, bundleID))
	})

	// Start subsystems
	if err := blockedSrv.Start(); err != nil {
		slog.Error("Blocked page server failed", "err", err)
	}
	if err := dnsSrv.Start(); err != nil {
		slog.Error("DNS blocker failed", "err", err)
	}
	appLocker.Start(ctx)
	actTracker.Start(ctx)

	// Alert detection loop
	go alertDetectionLoop(ctx, appLocker, alertMgr)

	// WebSocket + rules sync
	if cfg.IsRegistered() {
		wsClient.On("rules_update", func(msg map[string]any) {
			handleRulesUpdate(msg, rules)
		})
		wsClient.On("command", func(msg map[string]any) {
			handleCommand(ctx, msg, rules, ks, cfg)
		})
		wsClient.Start(ctx)
		syncRules(cfg, rules)
	} else {
		slog.Warn("Device not registered — run 'canopy-agent setup' first")
		slog.Info("Starting in offline mode with cached rules")
	}

	slog.Info("Canopy agent running")

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGTERM, syscall.SIGINT)
	<-sigCh

	slog.Info("Shutting down...")
	cancel()
	wsClient.Stop()
	actTracker.Stop()
	appLocker.Stop()
	dnsSrv.Stop()
	blockedSrv.Stop()
	if ks.IsActive() {
		_ = ks.Deactivate()
	}
	slog.Info("Canopy agent stopped")
}

func alertDetectionLoop(ctx context.Context, al *applock.AppLocker, am *alerts.Manager) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			switches := al.RecentSwitches(30 * time.Second)
			am.CheckRapidSwitching(switches)
			title := applock.GetWindowTitle()
			if title != "" {
				am.CheckWindowTitle(title)
			}
		}
	}
}

func handleRulesUpdate(msg map[string]any, rules *config.Rules) {
	rulesData, ok := msg["rules"].(map[string]any)
	if !ok {
		return
	}
	if domains, ok := rulesData["blocked_domains"].([]any); ok {
		var ds []string
		for _, d := range domains {
			if s, ok := d.(string); ok {
				ds = append(ds, s)
			}
		}
		rules.SetDomains(ds)
	}
	if apps, ok := rulesData["blocked_apps"].([]any); ok {
		var as []string
		for _, a := range apps {
			if s, ok := a.(string); ok {
				as = append(as, s)
			}
		}
		rules.SetApps(as)
	}
	_ = rules.Save()
	slog.Info("Rules updated via WebSocket")
}

func handleCommand(ctx context.Context, msg map[string]any, rules *config.Rules, ks *killswitch.KillSwitch, cfg *config.AgentConfig) {
	action, _ := msg["action"].(string)
	slog.Info("Received command", "action", action)

	switch action {
	case "kill_internet":
		if err := ks.Activate(ctx); err != nil {
			slog.Error("Kill switch activation failed", "err", err)
		}
	case "restore_internet":
		if err := ks.Deactivate(); err != nil {
			slog.Error("Kill switch deactivation failed", "err", err)
		}
	case "sync_rules":
		syncRules(cfg, rules)
	case "lock_app":
		if app, ok := msg["app"].(string); ok && app != "" {
			rules.AddApp(app)
			_ = rules.Save()
		}
	case "unlock_app":
		if app, ok := msg["app"].(string); ok {
			rules.RemoveApp(app)
			_ = rules.Save()
		}
	default:
		slog.Warn("Unknown command", "action", action)
	}
}

func syncRules(cfg *config.AgentConfig, rules *config.Rules) {
	if !cfg.IsRegistered() {
		return
	}
	url := fmt.Sprintf("%s/api/v1/rules/sync/%s", cfg.BackendURL, cfg.DeviceID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return
	}
	req.Header.Set("X-Device-Token", cfg.DeviceToken)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		slog.Warn("Rules sync failed", "err", err)
		return
	}
	defer resp.Body.Close()

	var rulesList []map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&rulesList); err != nil {
		slog.Warn("Rules sync parse error", "err", err)
		return
	}

	var domains, apps []string
	var schedules []map[string]any
	for _, rule := range rulesList {
		rt, _ := rule["rule_type"].(string)
		target, _ := rule["target"].(string)
		switch rt {
		case "block_site":
			domains = append(domains, target)
		case "block_app":
			apps = append(apps, target)
		case "schedule":
			schedules = append(schedules, rule)
		}
	}
	rules.SetDomains(domains)
	rules.SetApps(apps)
	rules.SetSchedules(schedules)
	_ = rules.Save()
	slog.Info("Rules synced", "sites", len(domains), "apps", len(apps))

}
