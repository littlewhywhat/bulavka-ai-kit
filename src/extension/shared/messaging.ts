import { createExtensionMessaging } from "../../common/extension/messaging";
import type { BackgroundMessages, ContentMessages } from "../../types/messages";

const { sendMessage, onBackgroundMessage, sendToTab } =
  createExtensionMessaging<BackgroundMessages, ContentMessages>();

export { onBackgroundMessage, sendMessage, sendToTab };
