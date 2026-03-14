import type { Pin } from "../types/messages";
import { sendMessage } from "./messaging";

const STORAGE_KEY = "bulavka-ai-kit-pins";

type Listener = (pins: Pin[]) => void;

const getPins = (): Pin[] => [];

const loadPins = async (): Promise<Pin[]> => {
  return sendMessage("pins-get", undefined);
};

const addPin = (pin: Pin): void => {
  sendMessage("pins-add", pin);
};

const removePin = (conversationId: string, messageId: string): void => {
  sendMessage("pins-remove", { conversationId, messageId });
};

const isPinned = async (
  conversationId: string,
  messageId: string,
): Promise<boolean> => {
  const pins = await loadPins();
  return pins.some(
    (p) => p.conversationId === conversationId && p.messageId === messageId,
  );
};

const onPinsChange = (cb: Listener): (() => void) => {
  const handler = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName !== "sync" || !changes[STORAGE_KEY]) return;
    const raw = changes[STORAGE_KEY].newValue;
    if (raw === undefined) return;
    try {
      const pins: Pin[] =
        typeof raw === "string"
          ? (JSON.parse(raw) as Pin[])
          : Array.isArray(raw)
            ? raw
            : [];
      cb(pins);
    } catch {
      cb([]);
    }
  };
  chrome.storage.onChanged.addListener(handler);

  loadPins().then(cb);

  return () => chrome.storage.onChanged.removeListener(handler);
};

const updatePinPreview = (
  conversationId: string,
  messageId: string,
  preview: string,
): void => {
  sendMessage("pins-update-preview", {
    conversationId,
    messageId,
    preview,
  });
};

const requestUnpin = (pin: Pin): void => {
  sendMessage("request-show-unpin-modal", pin);
};

export {
  getPins,
  loadPins,
  addPin,
  removePin,
  isPinned,
  onPinsChange,
  updatePinPreview,
  requestUnpin,
};
export type { Pin };
