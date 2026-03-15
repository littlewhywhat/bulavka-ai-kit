import { sendLifecycleEvent, sendUserAction } from "./ping";
import { analyticsStorage } from "./storage";

const HEARTBEAT_ALARM = "heartbeat";
const HEARTBEAT_MINUTES = 360;

const TOGGLE_TO_ACTION = {
  pinsSectionEnabled: {
    on: "enable_pin_replies",
    off: "disable_pin_replies",
  },
  pinnedChatsSectionEnabled: {
    on: "enable_favourites_chats",
    off: "disable_favourites_chats",
  },
} as const;

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
  }

  setupAlarm();
};

const onStartup = async (): Promise<void> => {
  await analyticsStorage.set({ last_startup_at: Date.now() });
};

const onAlarm = async (alarm: chrome.alarms.Alarm): Promise<void> => {
  if (alarm.name !== HEARTBEAT_ALARM) return;
  await sendLifecycleEvent("ping");
};

const onStorageChange = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string,
): void => {
  if (areaName !== "local") return;

  for (const [key, change] of Object.entries(changes)) {
    const mapping = TOGGLE_TO_ACTION[key as keyof typeof TOGGLE_TO_ACTION];
    if (mapping != null && change?.newValue !== undefined) {
      const action = change.newValue ? mapping.on : mapping.off;
      sendUserAction(action);
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
