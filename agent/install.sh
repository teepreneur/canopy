#!/bin/bash
set -e

echo "🌿 Canopy Agent Installer"
echo "========================="

# Check for root/sudo
if [ "$EUID" -ne 0 ]; then
    echo "This installer requires admin privileges."
    echo "Please run: sudo ./install.sh"
    exit 1
fi

INSTALL_DIR="/usr/local/lib/canopy"
BIN_LINK="/usr/local/bin/canopy-agent"
PLIST_SRC="$(dirname "$0")/resources/com.canopy.agent.plist"
PLIST_DST="/Library/LaunchDaemons/com.canopy.agent.plist"
VENV_DIR="${INSTALL_DIR}/venv"

echo ""
echo "Installing to ${INSTALL_DIR}..."

# Create install directory
mkdir -p "${INSTALL_DIR}"
cp -R "$(dirname "$0")/canopy_agent" "${INSTALL_DIR}/"
cp -R "$(dirname "$0")/resources" "${INSTALL_DIR}/"
cp "$(dirname "$0")/requirements.txt" "${INSTALL_DIR}/"

# Create virtual environment
echo "Setting up Python environment..."
python3 -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/pip" install --quiet --upgrade pip
"${VENV_DIR}/bin/pip" install --quiet -r "${INSTALL_DIR}/requirements.txt"

# Create launcher script
cat > "${BIN_LINK}" << 'LAUNCHER'
#!/bin/bash
exec /usr/local/lib/canopy/venv/bin/python -m canopy_agent.main "$@"
LAUNCHER
chmod 755 "${BIN_LINK}"

# Install launchd plist
echo "Installing launchd daemon..."
cp "${PLIST_SRC}" "${PLIST_DST}"
chmod 644 "${PLIST_DST}"
chown root:wheel "${PLIST_DST}"

# Create config directory for the user
REAL_USER="${SUDO_USER:-$(logname 2>/dev/null || echo $USER)}"
REAL_HOME=$(eval echo "~${REAL_USER}")
CONFIG_DIR="${REAL_HOME}/Library/Application Support/Canopy"
mkdir -p "${CONFIG_DIR}"
chown "${REAL_USER}" "${CONFIG_DIR}"
chmod 700 "${CONFIG_DIR}"

# Load the daemon
launchctl load "${PLIST_DST}" 2>/dev/null || true

echo ""
echo "✅ Canopy agent installed!"
echo ""
echo "Next steps:"
echo "  1. Run 'canopy-agent setup' to pair this device"
echo "  2. The agent will start automatically on boot"
echo "  3. To start now: sudo launchctl start com.canopy.agent"
echo ""
