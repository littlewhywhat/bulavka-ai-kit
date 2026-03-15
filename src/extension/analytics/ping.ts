import { getEndpoint, getProjectToken } from "./endpoint";
import { analyticsStorage } from "./storage";
import type { ExtensionEventPayload, UserAction } from "./types";

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

const buildLifecycleFields = (now: number) => {
  const ua = navigator.userAgent;
  const start = extensionStartTime ?? now;

  return {
    uptime_ms: now - start,
    is_webdriver: navigator.webdriver ?? false,
    is_headless: ua.includes("HeadlessChrome"),
    browser: getBrowserInfo(),
    platform: navigator.platform,
    language: navigator.language,
  };
};

const sendLifecycleEvent = async (
  eventType: "ping" | "install" | "update",
): Promise<void> => {
  captureStartTime();
  const stored = await analyticsStorage.get();
  if (stored?.uuid == null) return;

  const manifest = chrome.runtime.getManifest();
  const now = Date.now();
  const sequence =
    eventType === "ping"
      ? (stored.ping_sequence ?? 0) + 1
      : (stored.ping_sequence ?? 0);

  const payload: ExtensionEventPayload = {
    event_type: eventType,
    project_token: getProjectToken(),
    uuid: stored.uuid,
    current_version: manifest.version,
    timestamp: now,
    installed_at: stored.installed_at ?? 0,
    installed_version: stored.installed_version ?? "",
    updated_at: stored.updated_at ?? 0,
    updated_version: stored.updated_version ?? "",
    update_url: manifest.update_url ?? null,
    pinged_at: now,
    last_pinged_at: stored.last_pinged_at ?? null,
    last_startup_at: stored.last_startup_at ?? null,
    ping_sequence: sequence,
    ...buildLifecycleFields(now),
  };

  await sendPayload(payload);

  if (eventType === "ping") {
    await analyticsStorage.set({
      last_pinged_at: now,
      ping_sequence: sequence,
    });
  }
};

const sendUserAction = async (action: UserAction): Promise<void> => {
  const stored = await analyticsStorage.get();
  if (stored?.uuid == null) return;

  const payload: ExtensionEventPayload = {
    event_type: "user_action",
    project_token: getProjectToken(),
    uuid: stored.uuid,
    current_version: chrome.runtime.getManifest().version,
    timestamp: Date.now(),
    action,
  };
  await sendPayload(payload);
};

export { sendLifecycleEvent, sendUserAction };
