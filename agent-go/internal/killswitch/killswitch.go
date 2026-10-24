package killswitch

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/teepreneur/canopy/agent-go/internal/config"
)

const pfAnchor = "com.canopy.agent"

type KillSwitch struct {
	cfg       *config.AgentConfig
	mu        sync.Mutex
	active    bool
	activAt   time.Time
	rulesPath string
	cancel    context.CancelFunc
}

func New(cfg *config.AgentConfig) *KillSwitch {
	return &KillSwitch{cfg: cfg}
}

func (k *KillSwitch) IsActive() bool {
	k.mu.Lock()
	defer k.mu.Unlock()
	return k.active
}

func (k *KillSwitch) Activate(ctx context.Context) error {
	k.mu.Lock()
	defer k.mu.Unlock()
	if k.active {
		return nil
	}

	host := k.cfg.BackendURL
	if i := strings.Index(host, "://"); i >= 0 {
		host = host[i+3:]
	}
	if i := strings.IndexAny(host, ":/"); i >= 0 {
		host = host[:i]
	}

	rules := fmt.Sprintf(
		"pass out quick on lo0 all\n"+
			"pass out quick proto tcp from any to %s\n"+
			"pass out quick proto udp from any to %s\n"+
			"pass out quick proto tcp from any to any port 53\n"+
			"pass out quick proto udp from any to any port 53\n"+
			"block out all\n",
		host, host,
	)

	f, err := os.CreateTemp("", "canopy_pf_*.conf")
	if err != nil {
		return err
	}
	k.rulesPath = f.Name()
	if _, err := f.WriteString(rules); err != nil {
		f.Close()
		return err
	}
	f.Close()

	if out, err := exec.Command("sudo", "-n", "pfctl", "-a", pfAnchor, "-f", k.rulesPath).CombinedOutput(); err != nil {
		os.Remove(k.rulesPath)
		return fmt.Errorf("pfctl load failed: %s", string(out))
	}
	_ = exec.Command("sudo", "-n", "pfctl", "-e").Run()

	k.active = true
	k.activAt = time.Now()
	slog.Info("Kill switch ACTIVATED")

	ctx2, cancel := context.WithCancel(ctx)
	k.cancel = cancel
	go k.safetyTimeout(ctx2)
	return nil
}

func (k *KillSwitch) Deactivate() error {
	k.mu.Lock()
	defer k.mu.Unlock()
	if !k.active {
		return nil
	}
	if out, err := exec.Command("sudo", "-n", "pfctl", "-a", pfAnchor, "-F", "all").CombinedOutput(); err != nil {
		return fmt.Errorf("pfctl flush failed: %s", string(out))
	}
	k.active = false
	if k.cancel != nil {
		k.cancel()
		k.cancel = nil
	}
	if k.rulesPath != "" {
		os.Remove(k.rulesPath)
		k.rulesPath = ""
	}
	slog.Info("Kill switch DEACTIVATED")
	return nil
}

func (k *KillSwitch) safetyTimeout(ctx context.Context) {
	timer := time.NewTimer(time.Duration(k.cfg.KillSwitchTimeout) * time.Second)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return
	case <-timer.C:
		slog.Warn("Kill switch safety timeout — auto-restoring", "timeout_s", k.cfg.KillSwitchTimeout)
		_ = k.Deactivate()
	}
}
