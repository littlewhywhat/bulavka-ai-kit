const SPRITES_CORE = "/cdn/assets/sprites-core-fk4oovux.svg";
const SPRITES_CORE_LOTTIE = "/cdn/assets/sprites-core-lbtco6v1.svg";

const chatgptConfig = {
  selectors: {
    historyContainer: "div#history",
    expandoSection: ".group\\/sidebar-expando-section",
    assistantToolbarRow:
      'section[data-turn="assistant"] > div > div > div.justify-start > div',
    menuTriggerInToolbar: '[aria-haspopup="menu"]',
    openContextMenu:
      '[data-radix-menu-content][role="menu"][data-state="open"]',
    sidebarItem: "a[data-sidebar-item]",
    truncatedText: ".truncate",
    messageElement: "div[data-message-id]",
    assistantSection: "section",
    menuItem: '[role="menuitem"]',
    menuSeparator: '[role="separator"]',
  },

  attributes: {
    conversationOptionsTrigger: "data-conversation-options-trigger",
    messageId: "data-message-id",
  },

  text: {
    pinChatMenuItem: "pin chat",
  },

  sprites: {
    pinFilled: `${SPRITES_CORE}#13322a`,
    pinOutline: `${SPRITES_CORE}#23d2ff`,
    menuDots: `${SPRITES_CORE}#f6d0e2`,
    rename: `${SPRITES_CORE}#6d87e1`,
    chevronCollapsed: `${SPRITES_CORE}#d3876b`,
    chevronExpanded: `${SPRITES_CORE}#ba3792`,
    pinSmall: `${SPRITES_CORE}#a8c6bd`,
    folderClosed: `${SPRITES_CORE_LOTTIE}#61ee0c`,
  },

  routes: {
    chatSegment: "c",
    branchPrefix: "/branch/",
    webBrowsingMarker: "WEB:",
  },
} as const;

export { chatgptConfig };
