import type { PinnedChat } from "../types/messages";
import { sendMessage } from "./messaging";

const STORAGE_KEY = "bulavka-ai-kit-pinned-chats";

type Listener = (chats: PinnedChat[]) => void;

let cachedChats: PinnedChat[] = [];

const getPinnedChats = (): PinnedChat[] => cachedChats;

const isPinnedChat = (conversationId: string): boolean =>
  cachedChats.some((c) => c.conversationId === conversationId);

const addPinnedChat = (chat: PinnedChat): void => {
  sendMessage("pinned-chats-add", chat);
};

const loadPinnedChats = async (): Promise<PinnedChat[]> => {
  return sendMessage("pinned-chats-get", undefined);
};

const removePinnedChat = (conversationId: string): void => {
  sendMessage("pinned-chats-remove", { conversationId });
};

const updatePinnedChatTitle = (conversationId: string, title: string): void => {
  sendMessage("pinned-chats-update-title", { conversationId, title });
};

const parseChats = (raw: unknown): PinnedChat[] => {
  try {
    if (typeof raw === "string") return JSON.parse(raw) as PinnedChat[];
    if (Array.isArray(raw)) return raw;
    return [];
  } catch {
    return [];
  }
};

const onPinnedChatsChange = (cb: Listener): (() => void) => {
  const handler = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName !== "sync" || !changes[STORAGE_KEY]) return;
    const raw = changes[STORAGE_KEY].newValue;
    if (raw === undefined) return;
    cachedChats = parseChats(raw);
    cb(cachedChats);
  };
  chrome.storage.onChanged.addListener(handler);

  loadPinnedChats().then((chats) => {
    cachedChats = chats;
    cb(cachedChats);
  });

  return () => chrome.storage.onChanged.removeListener(handler);
};

export {
  getPinnedChats,
  isPinnedChat,
  addPinnedChat,
  loadPinnedChats,
  removePinnedChat,
  updatePinnedChatTitle,
  onPinnedChatsChange,
};
export type { PinnedChat };
