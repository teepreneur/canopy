"""First-run pairing and registration wizard."""

import asyncio
import sys

import httpx

from .config import AgentConfig


async def register_device(config: AgentConfig, pairing_code: str) -> bool:
    url = f"{config.backend_url}/api/auth/register-device"
    payload = {
        "pairing_code": pairing_code,
        "platform": "macos",
        "hostname": _get_hostname(),
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            config.device_id = data["device_id"]
            config.device_token = data["device_token"]
            config.family_id = data.get("family_id", "")
            config.child_profile_id = data.get("child_profile_id", "")
            config.save()
            return True
    except httpx.HTTPStatusError as e:
        print(f"\nRegistration failed: {e.response.text}")
        return False
    except httpx.ConnectError:
        print(f"\nCannot reach backend at {config.backend_url}")
        return False


def _get_hostname() -> str:
    import platform
    return platform.node()


def run_setup_wizard() -> None:
    print("\n╔══════════════════════════════════════╗")
    print("║      🌿 Canopy Device Setup 🌿      ║")
    print("╚══════════════════════════════════════╝\n")

    config = AgentConfig.load()

    if config.is_registered:
        print(f"This device is already registered (ID: {config.device_id})")
        answer = input("Re-register with a new pairing code? [y/N]: ").strip().lower()
        if answer != "y":
            print("Setup cancelled.")
            return

    backend_url = input(f"Backend URL [{config.backend_url}]: ").strip()
    if backend_url:
        config.backend_url = backend_url.rstrip("/")
        config.ws_url = config.backend_url.replace("http://", "ws://").replace("https://", "wss://")

    pairing_code = input("Enter pairing code from the Canopy dashboard: ").strip()
    if not pairing_code:
        print("No pairing code entered. Aborting.")
        sys.exit(1)

    print("\nRegistering device...")
    success = asyncio.run(register_device(config, pairing_code))

    if success:
        print(f"\n✅ Device registered successfully!")
        print(f"   Device ID: {config.device_id}")
        print(f"   Family:    {config.family_id}")
        print("\nThe Canopy agent is ready to run.")
        print("Start with: canopy-agent run")
    else:
        print("\n❌ Registration failed. Check the pairing code and try again.")
        sys.exit(1)
