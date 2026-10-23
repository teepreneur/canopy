#!/bin/bash
set -e

echo "🌿 Canopy Agent Uninstaller"
echo "==========================="

if [ "$EUID" -ne 0 ]; then
    echo "Uninstalling requires admin privileges."
    echo "Please run: sudo ./uninstall.sh"
    exit 1
fi

PLIST="/Library/LaunchDaemons/com.canopy.agent.plist"
INSTALL_DIR="/usr/local/lib/canopy"
BIN_LINK="/usr/local/bin/canopy-agent"
PF_ANCHOR="com.canopy.agent"

echo ""

# Stop and unload the daemon
if [ -f "${PLIST}" ]; then
    echo "Stopping agent..."
    launchctl unload "${PLIST}" 2>/dev/null || true
    rm -f "${PLIST}"
fi

# Remove kill switch rules if active
echo "Cleaning up firewall rules..."
pfctl -a "${PF_ANCHOR}" -F all 2>/dev/null || true

# Remove installed files
echo "Removing files..."
rm -rf "${INSTALL_DIR}"
rm -f "${BIN_LINK}"
rm -f /tmp/canopy_pf_rules.conf
rm -f /tmp/canopy-agent.stdout.log
rm -f /tmp/canopy-agent.stderr.log

echo ""
echo "✅ Canopy agent uninstalled."
echo ""
echo "Note: Configuration in ~/Library/Application Support/Canopy/ was preserved."
echo "To remove it: rm -rf ~/Library/Application\\ Support/Canopy/"
echo ""
