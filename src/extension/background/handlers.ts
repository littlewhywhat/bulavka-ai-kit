import type { Pin, PinnedChat } from "../../types/messages";
import { sendUserAction } from "../analytics/ping";
import { onBackgroundMessage, sendToTab } from "../shared/messaging";
import { storage } from "../shared/storage";

const STORAGE_KEY = "bulavka-ai-kit-pins";
const PINNED_CHATS_STORAGE_KEY = "bulavka-ai-kit-pinned-chats";

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

const readPinnedChats = async (): Promise<PinnedChat[]> => {
  const result = await chrome.storage.sync.get(PINNED_CHATS_STORAGE_KEY);
  const raw = result[PINNED_CHATS_STORAGE_KEY];
  if (raw == null) return [];
  if (typeof raw !== "string") return [];
  try {
    return JSON.parse(raw) as PinnedChat[];
  } catch {
    return [];
  }
};

const writePinnedChats = async (chats: PinnedChat[]): Promise<void> => {
  await chrome.storage.sync.set({
    [PINNED_CHATS_STORAGE_KEY]: JSON.stringify(chats),
  });
};

const registerHandlers = () => {
  onBackgroundMessage("analytics-user-action", async ({ action }) => {
    await sendUserAction(action);
    return undefined;
  });

  onBackgroundMessage("pins-get", async () => readPins());

  onBackgroundMessage("pins-add", async (pin) => {
    const maxPins = await storage.get("maxPins");
    const pins = await readPins();
    const filtered = pins.filter(
      (p) =>
        !(
          p.conversationId === pin.conversationId &&
          p.messageId === pin.messageId
        ),
    );
    filtered.unshift(pin);
    await writePins(filtered.slice(0, maxPins));
    sendUserAction("pin_reply");
    return undefined;
  });

  onBackgroundMessage("pins-remove", async ({ conversationId, messageId }) => {
    const pins = await readPins();
    const filtered = pins.filter(
      (p) =>
        !(p.conversationId === conversationId && p.messageId === messageId),
    );
    await writePins(filtered);
    sendUserAction("unpin_reply");
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

  onBackgroundMessage("request-show-unpin-modal", async (pin, sender) => {
    if (sender.tab?.id != null) {
      await sendToTab(sender.tab.id, "show-unpin-modal", pin);
    }
    return undefined;
  });

  onBackgroundMessage("pinned-chats-get", async () => readPinnedChats());

  onBackgroundMessage("pinned-chats-add", async (chat) => {
    const maxPinnedChats = await storage.get("maxPinnedChats");
    const chats = await readPinnedChats();
    const isUpdate = chats.some(
      (c) => c.conversationId === chat.conversationId,
    );
    if (!isUpdate && chats.length >= maxPinnedChats) return undefined;
    const filtered = chats.filter(
      (c) => c.conversationId !== chat.conversationId,
    );
    filtered.unshift(chat);
    await writePinnedChats(filtered);
    sendUserAction("favourite_chat");
    return undefined;
  });

  onBackgroundMessage("pinned-chats-remove", async ({ conversationId }) => {
    const chats = await readPinnedChats();
    const filtered = chats.filter((c) => c.conversationId !== conversationId);
    await writePinnedChats(filtered);
    sendUserAction("unfavourite_chat");
    return undefined;
  });

  onBackgroundMessage(
    "request-show-unfavourite-modal",
    async (chat, sender) => {
      if (sender.tab?.id != null) {
        await sendToTab(sender.tab.id, "show-unfavourite-modal", chat);
      }
      return undefined;
    },
  );

  onBackgroundMessage(
    "request-show-favourite-limit-modal",
    async (payload, sender) => {
      if (sender.tab?.id != null) {
        await sendToTab(sender.tab.id, "show-favourite-limit-modal", payload);
      }
      return undefined;
    },
  );

  onBackgroundMessage(
    "pinned-chats-update-title",
    async ({ conversationId, title }) => {
      const chats = await readPinnedChats();
      const updated = chats.map((c) =>
        c.conversationId === conversationId ? { ...c, title } : c,
      );
      await writePinnedChats(updated);
      return undefined;
    },
  );
};

export { registerHandlers };
