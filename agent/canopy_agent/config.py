"""Configuration management for the Canopy agent."""

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

CONFIG_DIR = Path.home() / "Library" / "Application Support" / "Canopy"
CONFIG_FILE = CONFIG_DIR / "config.json"
RULES_FILE = CONFIG_DIR / "rules.json"

DEFAULT_BACKEND_URL = "http://localhost:8000"
DEFAULT_WS_URL = "ws://localhost:8000"


@dataclass
class AgentConfig:
    backend_url: str = DEFAULT_BACKEND_URL
    ws_url: str = DEFAULT_WS_URL
    device_id: str = ""
    device_token: str = ""
    family_id: str = ""
    child_profile_id: str = ""
    dns_port: int = 5354
    blocked_page_port: int = 8853
    heartbeat_interval: int = 30
    activity_upload_interval: int = 300
    kill_switch_timeout: int = 14400  # 4 hours

    def save(self) -> None:
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        CONFIG_FILE.write_text(json.dumps(self.__dict__, indent=2))
        os.chmod(CONFIG_FILE, 0o600)

    @classmethod
    def load(cls) -> "AgentConfig":
        if CONFIG_FILE.exists():
            data = json.loads(CONFIG_FILE.read_text())
            return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
        return cls()

    @property
    def is_registered(self) -> bool:
        return bool(self.device_id and self.device_token)


@dataclass
class Rules:
    blocked_domains: list[str] = field(default_factory=list)
    blocked_apps: list[str] = field(default_factory=list)
    schedules: list[dict[str, Any]] = field(default_factory=list)

    def save(self) -> None:
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        RULES_FILE.write_text(json.dumps(self.__dict__, indent=2))

    @classmethod
    def load(cls) -> "Rules":
        if RULES_FILE.exists():
            data = json.loads(RULES_FILE.read_text())
            return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
        return cls()

    def is_domain_blocked(self, domain: str) -> bool:
        domain = domain.lower().rstrip(".")
        for pattern in self.blocked_domains:
            pattern = pattern.lower().rstrip(".")
            if pattern.startswith("*."):
                suffix = pattern[2:]
                if domain == suffix or domain.endswith("." + suffix):
                    return True
            elif domain == pattern:
                return True
        return False

    def is_app_blocked(self, bundle_id_or_name: str) -> bool:
        check = bundle_id_or_name.lower()
        return any(b.lower() == check for b in self.blocked_apps)
