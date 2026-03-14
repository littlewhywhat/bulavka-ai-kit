import { MAX_PINS, type Pin } from "../../types/messages";
import { onBackgroundMessage, sendToTab } from "../shared/messaging";

const STORAGE_KEY = "bulavka-ai-kit-pins";

const readPins = async (): Promise<Pin[]> => {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  const raw = result[STORAGE_KEY];
  if (raw == null) return [];
  if (typeof raw !== "string") return [];
  try {
    return JSON.parse(raw) as Pin[];
  } catch {
    return [];
  }
};

const writePins = async (pins: Pin[]): Promise<void> => {
  await chrome.storage.sync.set({
    [STORAGE_KEY]: JSON.stringify(pins),
  });
};

const registerHandlers = () => {
  onBackgroundMessage("pins-get", async () => readPins());

  onBackgroundMessage("pins-add", async (pin) => {
    const pins = await readPins();
    const filtered = pins.filter(
      (p) =>
        !(
          p.conversationId === pin.conversationId &&
          p.messageId === pin.messageId
        ),
    );
    filtered.unshift(pin);
    await writePins(filtered.slice(0, MAX_PINS));
    return undefined;
  });

  onBackgroundMessage("pins-remove", async ({ conversationId, messageId }) => {
    const pins = await readPins();
    const filtered = pins.filter(
      (p) =>
        !(p.conversationId === conversationId && p.messageId === messageId),
    );
    await writePins(filtered);
    return undefined;
  });

  onBackgroundMessage(
    "pins-update-preview",
    async ({ conversationId, messageId, preview }) => {
      const pins = await readPins();
      const updated = pins.map((p) =>
        p.conversationId === conversationId && p.messageId === messageId
          ? { ...p, preview }
          : p,
      );
      await writePins(updated);
      return undefined;
    },
  );

  onBackgroundMessage("request-show-unpin-modal", (pin, sender) => {
    if (sender.tab?.id != null) {
      sendToTab(sender.tab.id, "show-unpin-modal", pin);
    }
    return undefined;
  });
};

export { registerHandlers };
