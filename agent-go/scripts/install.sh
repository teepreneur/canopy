#!/bin/bash
set -e

INSTALL_DIR="/usr/local/bin"
PLIST_SRC="$(dirname "$0")/../resources/com.canopy.agent.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.canopy.agent.plist"
BINARY_SRC="$(dirname "$0")/../canopy-agent"

echo "Canopy Agent Installer"
echo "======================"
echo

# Check binary exists
if [ ! -f "$BINARY_SRC" ]; then
    echo "Error: canopy-agent binary not found. Run 'go build' first."
    echo "  cd agent-go && go build -o canopy-agent ./cmd/canopy-agent/"
    exit 1
fi

# Stop existing agent if running
if launchctl list | grep -q com.canopy.agent 2>/dev/null; then
    echo "Stopping existing agent..."
    launchctl unload "$PLIST_DST" 2>/dev/null || true
fi

# Install binary
echo "Installing binary to $INSTALL_DIR..."
sudo cp "$BINARY_SRC" "$INSTALL_DIR/canopy-agent"
sudo chmod 755 "$INSTALL_DIR/canopy-agent"

# Install launchd plist
echo "Installing launch agent..."
mkdir -p "$HOME/Library/LaunchAgents"
cp "$PLIST_SRC" "$PLIST_DST"

echo
echo "Installation complete!"
echo
echo "Next steps:"
echo "  1. Run setup:  canopy-agent setup"
echo "  2. Start agent: launchctl load $PLIST_DST"
echo "     (or it will start automatically on next login)"
echo
echo "To uninstall:"
echo "  launchctl unload $PLIST_DST"
echo "  rm $PLIST_DST"
echo "  sudo rm $INSTALL_DIR/canopy-agent"
