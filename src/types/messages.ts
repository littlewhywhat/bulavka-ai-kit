const MAX_PINS = 5;
const INITIAL_PINS_VISIBLE = 3;
const MAX_PINNED_CHATS = 5;
const INITIAL_PINNED_CHATS_VISIBLE = 3;

type Pin = {
  conversationId: string;
  messageId: string;
  preview: string;
  pinnedAt: number;
};

type PinnedChat = {
  conversationId: string;
  title: string;
  pinnedAt: number;
};

export {
  MAX_PINS,
  INITIAL_PINS_VISIBLE,
  MAX_PINNED_CHATS,
  INITIAL_PINNED_CHATS_VISIBLE,
};

type BackgroundMessages = {
  "pins-get": {
    request: undefined;
    response: Pin[];
  };
  "pins-add": {
    request: Pin;
    response: undefined;
  };
  "pins-remove": {
    request: { conversationId: string; messageId: string };
    response: undefined;
  };
  "pins-update-preview": {
    request: {
      conversationId: string;
      messageId: string;
      preview: string;
    };
    response: undefined;
  };
  "request-show-unpin-modal": {
    request: Pin;
    response: undefined;
  };
  "pinned-chats-get": {
    request: undefined;
    response: PinnedChat[];
  };
  "pinned-chats-add": {
    request: PinnedChat;
    response: undefined;
  };
  "pinned-chats-remove": {
    request: { conversationId: string };
    response: undefined;
  };
  "pinned-chats-update-title": {
    request: { conversationId: string; title: string };
    response: undefined;
  };
};

type ContentMessages = {
  "show-unpin-modal": {
    request: Pin;
    response: undefined;
  };
};

export type { Pin, BackgroundMessages, ContentMessages, PinnedChat };
