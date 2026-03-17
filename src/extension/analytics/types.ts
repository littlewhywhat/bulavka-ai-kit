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

type UserAction =
  | "pin_reply"
  | "unpin_reply"
  | "favourite_chat"
  | "unfavourite_chat"
  | "enable_favourites_chats"
  | "disable_favourites_chats"
  | "enable_pin_replies"
  | "disable_pin_replies";

type CommonFields = {
  project_token: string;
  uuid: string;
  current_version: string;
  timestamp: number;
};

type LifecycleFields = {
  installed_at: number;
  installed_version: string;
  updated_at: number;
  updated_version: string;
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

type PingPayload = CommonFields & LifecycleFields & { event_type: "ping" };
type InstallPayload = CommonFields &
  LifecycleFields & { event_type: "install" };
type UpdatePayload = CommonFields & LifecycleFields & { event_type: "update" };

type UserActionPayload = CommonFields & {
  event_type: "user_action";
  action: UserAction;
};

type UninstallPayload = Omit<CommonFields, "timestamp"> &
  LifecycleFields & { event_type: "uninstall" };

type ExtensionEventPayload =
  | PingPayload
  | InstallPayload
  | UpdatePayload
  | UserActionPayload;

export type {
  AnalyticsStorageSchema,
  ExtensionEventPayload,
  InstallPayload,
  LifecycleFields,
  PingPayload,
  UninstallPayload,
  UpdatePayload,
  UserAction,
  UserActionPayload,
};
