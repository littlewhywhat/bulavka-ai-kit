const PINS_KEY = "bulavka-ai-kit-pins";
const CHATS_KEY = "bulavka-ai-kit-pinned-chats";

export const parseStoredCount = (raw: unknown): number => {
  if (!raw || typeof raw !== "string") return 0;
  try {
    return (JSON.parse(raw) as unknown[]).length;
  } catch {
    return 0;
  }
};

export const readCounts = async () => {
  const [pinsResult, chatsResult] = await Promise.all([
    chrome.storage.sync.get(PINS_KEY),
    chrome.storage.sync.get(CHATS_KEY),
  ]);
  return {
    pinCount: parseStoredCount(pinsResult[PINS_KEY]),
    chatCount: parseStoredCount(chatsResult[CHATS_KEY]),
  };
};
