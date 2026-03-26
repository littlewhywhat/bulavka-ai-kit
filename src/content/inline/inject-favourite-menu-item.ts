import { observe } from "../../common/content/inline/observe";
import { chatgptConfig } from "../chatgpt-config";
import {
  addPinnedChat,
  getPinnedChats,
  isPinnedChat,
  onPinnedChatsChange,
  requestShowFavouriteLimit,
  requestUnfavourite,
} from "../pinnedChatsStorage";

const MARKER = "data-bulavka-fav-injected";

let maxPinnedChats = 5;

const syncMaxPinnedChats = () => {
  chrome.storage.local.get("maxPinnedChats").then((result) => {
    if (typeof result.maxPinnedChats === "number")
      maxPinnedChats = result.maxPinnedChats;
  });
  const handler = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName !== "local" || !changes.maxPinnedChats) return;
    const v = changes.maxPinnedChats.newValue;
    maxPinnedChats = typeof v === "number" ? v : 5;
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
};

const STAR_PATH =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";

const STAR_OFF_PATHS = [
  "m10.344 4.688 1.181-2.393a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.237 3.152",
  "m17.945 17.945.43 2.505a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a8 8 0 0 0 .4-.099",
  "m2 2 20 20",
];

const findTriggerForMenu = (menu: Element): Element | null => {
  const labelId = menu.getAttribute("aria-labelledby");
  if (!labelId) return null;
  const label = document.getElementById(labelId);
  if (!label?.hasAttribute(chatgptConfig.attributes.conversationOptionsTrigger))
    return null;
  return label;
};

const getConversationId = (trigger: Element): string | null =>
  trigger.getAttribute(chatgptConfig.attributes.conversationOptionsTrigger);

const getChatTitle = (trigger: Element): string => {
  const anchor = trigger.closest(chatgptConfig.selectors.sidebarItem);
  return (
    anchor
      ?.querySelector(chatgptConfig.selectors.truncatedText)
      ?.textContent?.trim() || "Untitled"
  ).slice(0, 40);
};

const createSvg = (isFav: boolean): SVGSVGElement => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("icon");

  if (isFav) {
    for (const d of STAR_OFF_PATHS) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
    }
  } else {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", STAR_PATH);
    svg.appendChild(p);
  }

  return svg;
};

const createMenuItem = (
  conversationId: string,
  title: string,
  isFav: boolean,
  pinnedAt: number,
): HTMLDivElement => {
  const item = document.createElement("div");
  item.setAttribute("role", "menuitem");
  item.setAttribute("tabindex", "0");
  item.className = "group __menu-item hoverable gap-1.5";
  item.setAttribute("data-orientation", "vertical");
  item.setAttribute("data-radix-collection-item", "");

  const iconWrap = document.createElement("div");
  iconWrap.className =
    "flex items-center justify-center group-disabled:opacity-50 group-data-disabled:opacity-50 icon";

  iconWrap.appendChild(createSvg(isFav));
  item.appendChild(iconWrap);

  const label = document.createTextNode(
    isFav ? "Remove from Favourites" : "Add to Favourites",
  );
  item.appendChild(label);

  item.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFav) {
      requestUnfavourite({ conversationId, title, pinnedAt });
    } else {
      const atLimit = getPinnedChats().length >= maxPinnedChats;
      if (atLimit) {
        requestShowFavouriteLimit(maxPinnedChats);
      } else {
        addPinnedChat({
          conversationId,
          title,
          pinnedAt: Date.now(),
        });
      }
    }

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });

  return item;
};

const injectIntoMenu = (menu: Element) => {
  const trigger = findTriggerForMenu(menu);
  if (!trigger) return;

  const conversationId = getConversationId(trigger);
  if (!conversationId) return;

  const title = getChatTitle(trigger);
  const isFav = isPinnedChat(conversationId);
  const existing = getPinnedChats().find(
    (c) => c.conversationId === conversationId,
  );

  const menuItems = menu.querySelectorAll(chatgptConfig.selectors.menuItem);
  const pinItem = Array.from(menuItems).find((el) =>
    el.textContent
      ?.trim()
      .toLowerCase()
      .includes(chatgptConfig.text.pinChatMenuItem),
  );

  const menuItem = createMenuItem(
    conversationId,
    title,
    isFav,
    existing?.pinnedAt ?? 0,
  );

  if (pinItem) {
    pinItem.parentElement?.insertBefore(menuItem, pinItem);
  } else {
    const separators = menu.querySelectorAll(
      chatgptConfig.selectors.menuSeparator,
    );
    if (separators.length > 0) {
      separators[0].parentElement?.insertBefore(menuItem, separators[0]);
    } else {
      menu.appendChild(menuItem);
    }
  }
};

const initFavouriteMenuItem = (): { dispose: () => void } => {
  const unsubscribe = onPinnedChatsChange(() => {});
  const disposeSync = syncMaxPinnedChats();

  const { dispose: observeDispose } = observe({
    selector: chatgptConfig.selectors.openContextMenu,
    onElement: (menu) => {
      injectIntoMenu(menu);
      return undefined;
    },
    markerAttr: MARKER,
  });

  return {
    dispose: () => {
      observeDispose();
      unsubscribe();
      disposeSync();
    },
  };
};

export { initFavouriteMenuItem };
