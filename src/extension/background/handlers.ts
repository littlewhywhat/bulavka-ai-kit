import {
  MAX_PINNED_CHATS,
  MAX_PINS,
  type Pin,
  type PinnedChat,
} from "../../types/messages";
import { onBackgroundMessage, sendToTab } from "../shared/messaging";

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

const TEST_PINNED_CHATS: PinnedChat[] = [
  {
    conversationId: "test-pinned-chat-1",
    title: "Test pinned chat",
    pinnedAt: Date.now() - 1000,
  },
  {
    conversationId: "69b5bf76-be54-832e-89e4-be3fcea17929",
    title: "Pinned chat",
    pinnedAt: Date.now(),
  },
];

const seedPinnedChatsIfEmpty = async (): Promise<void> => {
  const chats = await readPinnedChats();
  const existingIds = new Set(chats.map((c) => c.conversationId));
  const toAdd = TEST_PINNED_CHATS.filter((t) => !existingIds.has(t.conversationId));
  if (toAdd.length === 0) return;
  await writePinnedChats([...toAdd, ...chats]);
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

  onBackgroundMessage("pinned-chats-get", async () => readPinnedChats());

  onBackgroundMessage("pinned-chats-add", async (chat) => {
    const chats = await readPinnedChats();
    const filtered = chats.filter(
      (c) => c.conversationId !== chat.conversationId,
    );
    filtered.unshift(chat);
    await writePinnedChats(filtered.slice(0, MAX_PINNED_CHATS));
    return undefined;
  });

  onBackgroundMessage("pinned-chats-remove", async ({ conversationId }) => {
    const chats = await readPinnedChats();
    const filtered = chats.filter((c) => c.conversationId !== conversationId);
    await writePinnedChats(filtered);
    return undefined;
  });

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

  seedPinnedChatsIfEmpty();
};

export { registerHandlers };
