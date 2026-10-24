export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
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

export interface Family {
  id: string;
  name: string;
  created_at: string;
}

export interface FamilyCreate {
  name: string;
}

export interface ChildProfile {
  id: string;
  family_id: string;
  name: string;
  age?: number;
  avatar_url?: string;
  created_at: string;
}

export interface ChildProfileCreate {
  name: string;
  age?: number;
  avatar_url?: string;
}

export interface Device {
  id: string;
  family_id: string;
  child_profile_id: string | null;
  name: string;
  platform: string;
  is_online: boolean;
  last_heartbeat: string | null;
}

export interface PairingCodeCreate {
  child_profile_id?: string;
}

export interface PairingCode {
  code: string;
  expires_at: string;
}

export type ActivityType = "site_visit" | "app_usage";

export interface ActivityLog {
  id: string;
  device_id: string;
  child_profile_id: string | null;
  activity_type: ActivityType;
  target: string;
  title: string | null;
  duration_seconds: number;
  timestamp: string;
}

export interface DailySummary {
  date: string;
  total_screen_time_seconds: number;
  top_sites: { target: string; duration_seconds: number }[];
  top_apps: { target: string; duration_seconds: number }[];
}

export type AlertType =
  | "blocked_attempt"
  | "suspicious_activity"
  | "access_request"
  | "device_offline";

export type AlertStatus = "pending" | "acknowledged" | "approved" | "denied";

export interface Alert {
  id: string;
  family_id: string;
  device_id: string;
  child_profile_id: string | null;
  alert_type: AlertType;
  status: AlertStatus;
  title: string;
  detail: string | null;
  target: string | null;
  acknowledged: boolean;
  created_at: string;
}

export interface AlertAction {
  status: AlertStatus;
}

export type RuleType = "block_site" | "block_app" | "schedule";

export interface Rule {
  id: string;
  family_id: string;
  device_id: string | null;
  child_profile_id: string | null;
  rule_type: RuleType;
  target: string;
  enabled: boolean;
  schedule_days: string[] | null;
  schedule_start: string | null;
  schedule_end: string | null;
  created_at: string;
}

export interface RuleCreate {
  device_id?: string;
  child_profile_id?: string;
  rule_type: RuleType;
  target: string;
  enabled?: boolean;
  schedule_days?: string[];
  schedule_start?: string;
  schedule_end?: string;
}

export type CommandType =
  | "kill_internet"
  | "restore_internet"
  | "lock_app"
  | "unlock_app"
  | "refresh_rules";

export interface CommandCreate {
  device_id: string;
  command_type: CommandType;
  payload?: Record<string, unknown>;
}

export interface LocationUpdate {
  id: string;
  device_id: string;
  child_profile_id: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address: string | null;
  created_at: string;
}

export interface Geofence {
  id: string;
  family_id: string;
  child_profile_id: string | null;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_safe_zone: boolean;
  enabled: boolean;
  created_at: string;
}

export interface GeofenceCreate {
  child_profile_id?: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  is_safe_zone?: boolean;
}
