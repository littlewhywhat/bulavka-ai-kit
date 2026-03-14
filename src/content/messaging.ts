import { createContentMessaging } from "../common/content/messaging";
import type { BackgroundMessages, ContentMessages } from "../types/messages";

const { sendMessage, onContentMessage } = createContentMessaging<
  BackgroundMessages,
  ContentMessages
>();

export { onContentMessage, sendMessage };
