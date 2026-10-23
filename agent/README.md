# Canopy macOS Device Agent

Background service that enforces parental controls on a child's Mac — website blocking, app locking, activity monitoring, and internet kill switch — all managed remotely from the Canopy dashboard.

## Features

- **DNS-level website blocking** — local DNS proxy intercepts and filters queries
- **App locking** — detects app launches and terminates blocked apps with a notification
- **Activity tracking** — logs active app, window title, and DNS queries (no screenshots or keylogging)
- **Internet kill switch** — blocks all outbound traffic via macOS `pf` firewall
- **WebSocket real-time** — receives rule updates and commands instantly from the backend
- **Access requests** — child can request temporary access; parent approves from dashboard
- **Runs as launchd daemon** — starts on boot, auto-restarts on crash

## Quick Start (Development)

### Prerequisites

- Python 3.11+
- macOS 13+
- Backend API running at `http://localhost:8000` (see `backend/` directory)

### Setup

```bash
cd agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Pair the device

```bash
python -m canopy_agent.main setup
```

Enter the pairing code from the Canopy dashboard. This registers the device and stores credentials locally.

### Run the agent

```bash
python -m canopy_agent.main run -v
```

The `-v` flag enables verbose logging. The agent will:
1. Start the DNS filter on `127.0.0.1:5354`
2. Start the blocked page server on `127.0.0.1:8853`
3. Start monitoring app launches
4. Start activity tracking
5. Connect to the backend via WebSocket (if registered)

### Test DNS filtering

Point your DNS to the local proxy:

```bash
# Temporary — resets on reboot
sudo networksetup -setdnsservers Wi-Fi 127.0.0.1
```

To revert:

```bash
sudo networksetup -setdnsservers Wi-Fi empty
```

> **Note:** The agent listens on port 5354 by default (not 53) to avoid needing root during development. The install script configures the system to use it.

## Production Install

```bash
sudo ./install.sh
canopy-agent setup
sudo launchctl start com.canopy.agent
```

## Uninstall

```bash
sudo ./uninstall.sh
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 CanopyAgent                      │
│  (main.py — orchestrator)                        │
├──────────┬──────────┬──────────┬────────────────┤
│ DNS      │ App      │ Activity │ WebSocket      │
│ Filter   │ Monitor  │ Tracker  │ Client         │
│          │          │          │                │
│ dnslib   │ PyObjC / │ window   │ websockets     │
│ proxy    │ psutil   │ titles + │ + heartbeat    │
│          │          │ DNS logs │                │
├──────────┴──────────┴──────────┴────────────────┤
│ Kill Switch (pf)  │  Alerts  │  Blocked Page   │
└───────────────────┴──────────┴─────────────────┘
```

## Configuration

Config stored at `~/Library/Application Support/Canopy/config.json`:

| Key | Default | Description |
|-----|---------|-------------|
| `backend_url` | `http://localhost:8000` | Backend API URL |
| `dns_port` | `5354` | Local DNS proxy port |
| `blocked_page_port` | `8853` | Blocked page HTTP server port |
| `heartbeat_interval` | `30` | WebSocket heartbeat interval (seconds) |
| `activity_upload_interval` | `300` | Activity batch upload interval (seconds) |
| `kill_switch_timeout` | `14400` | Auto-restore kill switch after (seconds) |

## Offline Mode

If the backend is unreachable, the agent runs with cached rules and queues activity uploads for later. DNS filtering and app blocking work entirely offline once rules are cached.
