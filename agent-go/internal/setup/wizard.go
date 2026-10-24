package setup

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/teepreneur/canopy/agent-go/internal/config"
)

func RunWizard() {
	fmt.Println()
	fmt.Println("╔══════════════════════════════════════╗")
	fmt.Println("║      Canopy Device Setup             ║")
	fmt.Println("╚══════════════════════════════════════╝")
	fmt.Println()

	cfg := config.LoadConfig()
	reader := bufio.NewReader(os.Stdin)

	if cfg.IsRegistered() {
		fmt.Printf("This device is already registered (ID: %s)\n", cfg.DeviceID)
		fmt.Print("Re-register with a new pairing code? [y/N]: ")
		answer, _ := reader.ReadString('\n')
		if strings.TrimSpace(strings.ToLower(answer)) != "y" {
			fmt.Println("Setup cancelled.")
			return
		}
	}

	fmt.Printf("Backend URL [%s]: ", cfg.BackendURL)
	backendURL, _ := reader.ReadString('\n')
	backendURL = strings.TrimSpace(backendURL)
	if backendURL != "" {
		cfg.BackendURL = strings.TrimRight(backendURL, "/")
		cfg.WsURL = strings.Replace(cfg.BackendURL, "http://", "ws://", 1)
		cfg.WsURL = strings.Replace(cfg.WsURL, "https://", "wss://", 1)
	}

	fmt.Print("Enter pairing code from the Canopy app: ")
	code, _ := reader.ReadString('\n')
	code = strings.TrimSpace(code)
	if code == "" {
		fmt.Println("No pairing code entered. Aborting.")
		os.Exit(1)
	}

	fmt.Println("\nRegistering device...")
	if err := registerDevice(cfg, code); err != nil {
		fmt.Printf("\nRegistration failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("\nDevice registered successfully!")
	fmt.Printf("  Device ID: %s\n", cfg.DeviceID)
	fmt.Printf("  Family:    %s\n", cfg.FamilyID)
	fmt.Println("\nStart the agent with: canopy-agent run")
}

func registerDevice(cfg *config.AgentConfig, pairingCode string) error {
	hostname, _ := os.Hostname()
	payload := map[string]string{
		"pairing_code": pairingCode,
		"platform":     "macos",
		"name":         hostname,
	}
	body, _ := json.Marshal(payload)

	url := cfg.BackendURL + "/api/v1/devices/register"
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("cannot reach backend at %s: %w", cfg.BackendURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		var errBody map[string]any
		_ = json.NewDecoder(resp.Body).Decode(&errBody)
		return fmt.Errorf("server returned %d: %v", resp.StatusCode, errBody)
	}

	var data struct {
		DeviceID       string `json:"device_id"`
		DeviceToken    string `json:"device_token"`
		FamilyID       string `json:"family_id"`
		ChildProfileID string `json:"child_profile_id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return err
	}

	cfg.DeviceID = data.DeviceID
	cfg.DeviceToken = data.DeviceToken
	cfg.FamilyID = data.FamilyID
	cfg.ChildProfileID = data.ChildProfileID
	return cfg.Save()
}
