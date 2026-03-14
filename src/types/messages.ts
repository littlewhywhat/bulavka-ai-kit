const MAX_PINS = 5;
const INITIAL_PINS_VISIBLE = 3;

type Pin = {
  conversationId: string;
  messageId: string;
  preview: string;
  pinnedAt: number;
};

export { MAX_PINS, INITIAL_PINS_VISIBLE };

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
};

type ContentMessages = {
  "show-unpin-modal": {
    request: Pin;
    response: undefined;
  };
};

export type { Pin, BackgroundMessages, ContentMessages };
