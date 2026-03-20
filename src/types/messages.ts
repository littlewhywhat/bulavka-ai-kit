import type { UserAction } from "../extension/analytics/types";

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
  "request-show-unfavourite-modal": {
    request: PinnedChat;
    response: undefined;
  };
  "analytics-user-action": {
    request: { action: UserAction };
    response: undefined;
  };
};

type ContentMessages = {
  "show-unpin-modal": {
    request: Pin;
    response: undefined;
  };
  "show-unfavourite-modal": {
    request: PinnedChat;
    response: undefined;
  };
};

export type { Pin, BackgroundMessages, ContentMessages, PinnedChat };
