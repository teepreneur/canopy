export interface User {
  id: string;
  email: string;
  full_name: string;
  family_id: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface Device {
  id: string;
  name: string;
  device_type: string;
  os_version: string;
  is_online: boolean;
  last_seen: string;
  child_name?: string;
  internet_enabled: boolean;
}

export interface ActivityLog {
  id: string;
  device_id: string;
  activity_type: "website" | "app" | "search";
  title: string;
  url?: string;
  app_name?: string;
  duration_seconds: number;
  timestamp: string;
  category?: string;
  is_blocked: boolean;
}

export interface ActivitySummary {
  device_id: string;
  total_screen_time_minutes: number;
  top_apps: { name: string; minutes: number }[];
  top_sites: { domain: string; visits: number }[];
  blocked_attempts: number;
  period: string;
}

export interface Alert {
  id: string;
  device_id: string;
  device_name: string;
  alert_type: "blocked_attempt" | "suspicious_activity" | "access_request" | "device_offline";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
  is_reviewed: boolean;
  metadata?: Record<string, unknown>;
}

export interface Rule {
  id: string;
  device_id: string;
  rule_type: "block_site" | "block_app" | "time_limit" | "schedule";
  target: string;
  is_active: boolean;
  schedule?: {
    days: string[];
    start_time: string;
    end_time: string;
  };
  created_at: string;
}

export interface CreateRuleRequest {
  device_id: string;
  rule_type: Rule["rule_type"];
  target: string;
  is_active?: boolean;
  schedule?: Rule["schedule"];
}

export interface PairingCode {
  code: string;
  expires_at: string;
}

export interface Child {
  id: string;
  name: string;
  age?: number;
  avatar_color: string;
}

export interface Family {
  id: string;
  name: string;
  children: Child[];
}
