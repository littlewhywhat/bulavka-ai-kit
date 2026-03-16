import type { AnalyticsStorageSchema } from "./types";

const STORAGE_KEY = "bulavka-ai-kit-analytics";

const get = async (): Promise<Partial<AnalyticsStorageSchema> | null> => {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const raw = result[STORAGE_KEY];
  if (raw == null) return null;
  if (typeof raw !== "object") return null;
  return raw as Partial<AnalyticsStorageSchema>;
};

const set = async (data: Partial<AnalyticsStorageSchema>): Promise<void> => {
  const current = await get();
  const merged = { ...current, ...data };
  await chrome.storage.local.set({ [STORAGE_KEY]: merged });
};

export const analyticsStorage = { get, set };
