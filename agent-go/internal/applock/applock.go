package applock

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/teepreneur/canopy/agent-go/internal/config"
)

type BlockedCallback func(name, bundleID string)

type AppLocker struct {
	rules        *config.Rules
	pollInterval time.Duration
	cancel       context.CancelFunc

	mu              sync.Mutex
	onBlocked       []BlockedCallback
	appSwitchTimes  []time.Time
}

func New(rules *config.Rules) *AppLocker {
	return &AppLocker{
		rules:        rules,
		pollInterval: 1500 * time.Millisecond,
	}
}

func (a *AppLocker) OnBlocked(cb BlockedCallback) {
	a.onBlocked = append(a.onBlocked, cb)
}

func (a *AppLocker) RecentSwitches(window time.Duration) []time.Time {
	a.mu.Lock()
	defer a.mu.Unlock()
	cutoff := time.Now().Add(-window)
	var result []time.Time
	for _, t := range a.appSwitchTimes {
		if t.After(cutoff) {
			result = append(result, t)
		}
	}
	return result
}

func (a *AppLocker) Start(ctx context.Context) {
	ctx, a.cancel = context.WithCancel(ctx)
	go a.monitorLoop(ctx)
	slog.Info("App locker started")
}

func (a *AppLocker) Stop() {
	if a.cancel != nil {
		a.cancel()
	}
	slog.Info("App locker stopped")
}

func (a *AppLocker) monitorLoop(ctx context.Context) {
	lastApp := ""
	ticker := time.NewTicker(a.pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			name, bundleID := getForegroundApp()
			if name == "" {
				continue
			}
			if name != lastApp {
				a.mu.Lock()
				a.appSwitchTimes = append(a.appSwitchTimes, time.Now())
				a.trimSwitchTimes()
				a.mu.Unlock()
				lastApp = name
			}
			if a.rules.IsAppBlocked(bundleID) || a.rules.IsAppBlocked(name) {
				a.blockApp(name, bundleID)
			}
		}
	}
}

func (a *AppLocker) blockApp(name, bundleID string) {
	slog.Info("BLOCKED app", "name", name, "bundle", bundleID)
	terminateByName(name)
	sendNotification("App Blocked by Canopy", fmt.Sprintf("%s is not available right now.", name))
	for _, cb := range a.onBlocked {
		cb(name, bundleID)
	}
}

func (a *AppLocker) trimSwitchTimes() {
	cutoff := time.Now().Add(-2 * time.Minute)
	filtered := a.appSwitchTimes[:0]
	for _, t := range a.appSwitchTimes {
		if t.After(cutoff) {
			filtered = append(filtered, t)
		}
	}
	a.appSwitchTimes = filtered
}

func getForegroundApp() (name, bundleID string) {
	out, err := exec.Command("osascript", "-e",
		`tell application "System Events" to get {name, bundle identifier} of first process whose frontmost is true`).
		Output()
	if err != nil {
		return "", ""
	}
	parts := strings.SplitN(strings.TrimSpace(string(out)), ", ", 2)
	if len(parts) >= 1 {
		name = parts[0]
	}
	if len(parts) >= 2 {
		bundleID = parts[1]
	}
	return
}

func terminateByName(name string) {
	out, err := exec.Command("pgrep", "-x", name).Output()
	if err != nil {
		return
	}
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if line == "" {
			continue
		}
		var pid int
		if _, err := fmt.Sscanf(line, "%d", &pid); err == nil {
			_ = syscall.Kill(pid, syscall.SIGTERM)
		}
	}
}

func GetWindowTitle() string {
	out, err := exec.Command("osascript", "-e",
		`tell application "System Events" to get title of first window of first process whose frontmost is true`).
		Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out))
}

func sendNotification(title, message string) {
	script := fmt.Sprintf(`display notification "%s" with title "%s"`, message, title)
	_ = exec.Command("osascript", "-e", script).Run()
}

func init() {
	_ = os.Getenv("HOME")
}
