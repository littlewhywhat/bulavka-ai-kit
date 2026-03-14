import type { PinnedChat } from "../types/messages";
import { sendMessage } from "./messaging";

const STORAGE_KEY = "bulavka-ai-kit-pinned-chats";

type Listener = (chats: PinnedChat[]) => void;

const getPinnedChats = (): PinnedChat[] => [];

const loadPinnedChats = async (): Promise<PinnedChat[]> => {
  return sendMessage("pinned-chats-get", undefined);
};

const removePinnedChat = (conversationId: string): void => {
  sendMessage("pinned-chats-remove", { conversationId });
};

const updatePinnedChatTitle = (conversationId: string, title: string): void => {
  sendMessage("pinned-chats-update-title", { conversationId, title });
};

const onPinnedChatsChange = (cb: Listener): (() => void) => {
  const handler = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName !== "sync" || !changes[STORAGE_KEY]) return;
    const raw = changes[STORAGE_KEY].newValue;
    if (raw === undefined) return;
    try {
      const chats: PinnedChat[] =
        typeof raw === "string"
          ? (JSON.parse(raw) as PinnedChat[])
          : Array.isArray(raw)
            ? raw
            : [];
      cb(chats);
    } catch {
      cb([]);
    }
  };
  chrome.storage.onChanged.addListener(handler);

  loadPinnedChats().then(cb);

  return () => chrome.storage.onChanged.removeListener(handler);
};

export {
  getPinnedChats,
  loadPinnedChats,
  removePinnedChat,
  updatePinnedChatTitle,
  onPinnedChatsChange,
};
export type { PinnedChat };
