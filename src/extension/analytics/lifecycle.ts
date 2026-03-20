import { getAnalyticsBase, getProjectToken } from "./endpoint";
import { sendLifecycleEvent } from "./ping";
import { analyticsStorage } from "./storage";
import type { AnalyticsStorageSchema } from "./types";

const HEARTBEAT_ALARM = "heartbeat";
const HEARTBEAT_MINUTES = 360;

const buildUninstallUrl = (stored: Partial<AnalyticsStorageSchema>): string => {
  const manifest = chrome.runtime.getManifest();
  const ua = navigator.userAgent;
  const browserMatch = ua.match(/(Chrome|Firefox|Safari)\/(\d+)/);
  const params = new URLSearchParams({
    project_token: getProjectToken(),
    uuid: stored.uuid ?? "",
    current_version: manifest.version,
    installed_at: String(stored.installed_at ?? 0),
    installed_version: stored.installed_version ?? "",
    updated_at: String(stored.updated_at ?? 0),
    updated_version: stored.updated_version ?? "",
    update_url: manifest.update_url ?? "",
    last_pinged_at: String(stored.last_pinged_at ?? ""),
    last_startup_at: String(stored.last_startup_at ?? ""),
    ping_sequence: String(stored.ping_sequence ?? 0),
    is_webdriver: String(navigator.webdriver ?? false),
    is_headless: String(ua.includes("HeadlessChrome")),
    browser: browserMatch?.[0] ?? "unknown",
    platform: navigator.platform,
    language: navigator.language,
  });
  return `${getAnalyticsBase()}/uninstall?${params.toString()}`;
};

const setupUninstallUrl = async (): Promise<void> => {
  const stored = await analyticsStorage.get();
  if (stored?.uuid == null) return;
  const url = buildUninstallUrl(stored);
  chrome.runtime.setUninstallURL(url);
};

const setupAlarm = (): void => {
  chrome.alarms.get(HEARTBEAT_ALARM, (existing) => {
    if (existing == null) {
      chrome.alarms.create(HEARTBEAT_ALARM, {
        periodInMinutes: HEARTBEAT_MINUTES,
      });
    }
  });
};

const onInstalled = async (reason: string): Promise<void> => {
  const version = chrome.runtime.getManifest().version;
  const now = Date.now();

  if (reason === "install") {
    await analyticsStorage.set({
      uuid: crypto.randomUUID(),
      installed_at: now,
      installed_version: version,
      updated_at: now,
      updated_version: version,
      ping_sequence: 0,
    });
    sendLifecycleEvent("install");
    setupUninstallUrl();
  }

  if (reason === "update") {
    const current = await analyticsStorage.get();
    if (current?.uuid == null) {
      await analyticsStorage.set({
        uuid: crypto.randomUUID(),
        installed_at: now,
        installed_version: version,
        updated_at: now,
        updated_version: version,
        ping_sequence: 0,
      });
    } else {
      await analyticsStorage.set({
        updated_at: now,
        updated_version: version,
      });
    }
    sendLifecycleEvent("update");
    setupUninstallUrl();
  }

  setupAlarm();
};

const onStartup = async (): Promise<void> => {
  await analyticsStorage.set({ last_startup_at: Date.now() });
};

const onAlarm = async (alarm: chrome.alarms.Alarm): Promise<void> => {
  if (alarm.name !== HEARTBEAT_ALARM) return;
  await sendLifecycleEvent("ping");
  setupUninstallUrl();
};

const registerAnalytics = (): void => {
  chrome.runtime.onInstalled.addListener(({ reason }) => {
    onInstalled(reason);
  });

  chrome.runtime.onStartup.addListener(() => {
    onStartup();
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    onAlarm(alarm);
  });
};

export { registerAnalytics };
