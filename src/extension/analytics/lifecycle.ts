import { sendHeartbeat, sendSettingChange } from "./ping";
import { analyticsStorage } from "./storage";

const HEARTBEAT_ALARM = "heartbeat";
const HEARTBEAT_MINUTES = 360;

const SETTINGS_KEYS = new Set([
  "enabled",
  "maxPins",
  "initialPinsVisible",
  "maxPinnedChats",
  "initialPinnedChatsVisible",
  "pinsSectionEnabled",
  "pinnedChatsSectionEnabled",
]);

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
  }

  setupAlarm();
};

const onStartup = async (): Promise<void> => {
  await analyticsStorage.set({ last_startup_at: Date.now() });
};

const onAlarm = async (alarm: chrome.alarms.Alarm): Promise<void> => {
  if (alarm.name !== HEARTBEAT_ALARM) return;
  await sendHeartbeat();
};

const onStorageChange = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string,
): void => {
  if (areaName !== "local") return;

  for (const [key, change] of Object.entries(changes)) {
    if (SETTINGS_KEYS.has(key) && change?.newValue !== undefined) {
      sendSettingChange(key, change.newValue);
    }
  }
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

  chrome.storage.onChanged.addListener(onStorageChange);
};

export { registerAnalytics };
