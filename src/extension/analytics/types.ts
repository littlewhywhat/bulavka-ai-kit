type AnalyticsStorageSchema = {
  uuid: string;
  installed_at: number;
  installed_version: string;
  updated_at: number;
  updated_version: string;
  last_startup_at?: number;
  last_pinged_at?: number;
  ping_sequence: number;
};

type HeartbeatPayload = {
  event_type: "heartbeat";
  uuid: string;
  installed_at: number;
  installed_version: string;
  updated_at: number;
  updated_version: string;
  current_version: string;
  update_url: string | null;
  pinged_at: number;
  last_pinged_at: number | null;
  last_startup_at: number | null;
  ping_sequence: number;
  uptime_ms: number;
  is_webdriver: boolean;
  is_headless: boolean;
  browser: string;
  platform: string;
  language: string;
};

type SettingChangePayload = {
  event_type: "setting_change";
  uuid: string;
  timestamp: number;
  key: string;
  value: unknown;
};

type PinMessagePayload = {
  event_type: "pin_message";
  uuid: string;
  timestamp: number;
  value: boolean;
};

type FavouriteChatPayload = {
  event_type: "favourite_chat";
  uuid: string;
  timestamp: number;
  value: boolean;
};

type ExtensionEventPayload =
  | HeartbeatPayload
  | SettingChangePayload
  | PinMessagePayload
  | FavouriteChatPayload;

export type {
  AnalyticsStorageSchema,
  ExtensionEventPayload,
  FavouriteChatPayload,
  HeartbeatPayload,
  PinMessagePayload,
  SettingChangePayload,
};
