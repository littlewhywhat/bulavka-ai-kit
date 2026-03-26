import { chatgptConfig } from "../chatgpt-config";

const getConversationIdFromUrl = (): string | null => {
  const parts = location.pathname.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
};

const isBranchingAvailable = (): boolean => {
  const path = location.pathname;
  if (path.includes(chatgptConfig.routes.webBrowsingMarker)) return false;
  const parts = path.split("/").filter(Boolean);
  return parts.length >= 2 && parts[0] === chatgptConfig.routes.chatSegment;
};

export { getConversationIdFromUrl, isBranchingAvailable };
