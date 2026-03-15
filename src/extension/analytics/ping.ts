import { getEndpoint } from "./endpoint";
import { analyticsStorage } from "./storage";
import type {
  ExtensionEventPayload,
  FavouriteChatPayload,
  PinMessagePayload,
  SettingChangePayload,
} from "./types";

let extensionStartTime: number | null = null;

const captureStartTime = (): void => {
  if (extensionStartTime == null) extensionStartTime = Date.now();
};

const getBrowserInfo = (): string => {
  const ua = navigator.userAgent;
  const match = ua.match(/(Chrome|Firefox|Safari)\/(\d+)/);
  return match?.[0] ?? "unknown";
};

const sendPayload = async (payload: ExtensionEventPayload): Promise<void> => {
  const url = getEndpoint();
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // fire-and-forget
  }
};

const sendHeartbeat = async (): Promise<void> => {
  captureStartTime();
  const stored = await analyticsStorage.get();
  if (stored?.uuid == null) return;

  const manifest = chrome.runtime.getManifest();
  const now = Date.now();
  const sequence = (stored.ping_sequence ?? 0) + 1;
  const ua = navigator.userAgent;
  const isHeadless = ua.includes("HeadlessChrome");
  const start = extensionStartTime ?? now;

  const payload: ExtensionEventPayload = {
    event_type: "heartbeat",
    uuid: stored.uuid,
    installed_at: stored.installed_at ?? 0,
    installed_version: stored.installed_version ?? "",
    updated_at: stored.updated_at ?? 0,
    updated_version: stored.updated_version ?? "",
    current_version: manifest.version,
    update_url: manifest.update_url ?? null,
    pinged_at: now,
    last_pinged_at: stored.last_pinged_at ?? null,
    last_startup_at: stored.last_startup_at ?? null,
    ping_sequence: sequence,
    uptime_ms: now - start,
    is_webdriver: navigator.webdriver ?? false,
    is_headless: isHeadless,
    browser: getBrowserInfo(),
    platform: navigator.platform,
    language: navigator.language,
  };

  await sendPayload(payload);
  await analyticsStorage.set({ last_pinged_at: now, ping_sequence: sequence });
};

const sendSettingChange = async (
  key: string,
  value: unknown,
): Promise<void> => {
  const stored = await analyticsStorage.get();
  if (stored?.uuid == null) return;

  const payload: SettingChangePayload = {
    event_type: "setting_change",
    uuid: stored.uuid,
    timestamp: Date.now(),
    key,
    value,
  };
  await sendPayload(payload);
};

const sendPinMessage = async (value: boolean): Promise<void> => {
  const stored = await analyticsStorage.get();
  if (stored?.uuid == null) return;

  const payload: PinMessagePayload = {
    event_type: "pin_message",
    uuid: stored.uuid,
    timestamp: Date.now(),
    value,
  };
  await sendPayload(payload);
};

const sendFavouriteChat = async (value: boolean): Promise<void> => {
  const stored = await analyticsStorage.get();
  if (stored?.uuid == null) return;

  const payload: FavouriteChatPayload = {
    event_type: "favourite_chat",
    uuid: stored.uuid,
    timestamp: Date.now(),
    value,
  };
  await sendPayload(payload);
};

export { sendHeartbeat, sendSettingChange, sendPinMessage, sendFavouriteChat };
