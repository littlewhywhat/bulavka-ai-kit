import { observe } from "../../common/content/inline/observe";
import {
  addPinnedChat,
  isPinnedChat,
  onPinnedChatsChange,
  removePinnedChat,
} from "../pinnedChatsStorage";

const MARKER = "data-bulavka-fav-injected";
const MENU_SELECTOR =
  '[data-radix-menu-content][role="menu"][data-state="open"]';

const STAR_PATH =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";

const findTriggerForMenu = (): Element | null =>
  document.querySelector(
    '[data-conversation-options-trigger][aria-expanded="true"]',
  );

const getConversationId = (trigger: Element): string | null =>
  trigger.getAttribute("data-conversation-options-trigger");

const getChatTitle = (trigger: Element): string => {
  const anchor = trigger.closest("a[data-sidebar-item]");
  return anchor?.querySelector(".truncate")?.textContent?.trim() || "Untitled";
};

const createMenuItem = (
  conversationId: string,
  title: string,
  isFav: boolean,
): HTMLDivElement => {
  const item = document.createElement("div");
  item.setAttribute("role", "menuitem");
  item.setAttribute("tabindex", "0");
  item.className = "group __menu-item gap-1.5";
  item.setAttribute("data-orientation", "vertical");
  item.setAttribute("data-radix-collection-item", "");

  const iconWrap = document.createElement("div");
  iconWrap.className =
    "flex items-center justify-center group-disabled:opacity-50 group-data-disabled:opacity-50 icon";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", isFav ? "currentColor" : "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("icon");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", STAR_PATH);
  svg.appendChild(path);
  iconWrap.appendChild(svg);
  item.appendChild(iconWrap);

  const label = document.createTextNode(
    isFav ? "Remove from Favourites" : "Add to Favourites",
  );
  item.appendChild(label);

  item.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFav) {
      removePinnedChat(conversationId);
    } else {
      addPinnedChat({
        conversationId,
        title,
        pinnedAt: Date.now(),
      });
    }

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });

  return item;
};

const injectIntoMenu = (menu: Element) => {
  const trigger = findTriggerForMenu();
  if (!trigger) return;

  const conversationId = getConversationId(trigger);
  if (!conversationId) return;

  const title = getChatTitle(trigger);
  const isFav = isPinnedChat(conversationId);

  const menuItems = menu.querySelectorAll('[role="menuitem"]');
  const pinItem = Array.from(menuItems).find((el) =>
    el.textContent?.trim().toLowerCase().includes("pin chat"),
  );

  const menuItem = createMenuItem(conversationId, title, isFav);

  if (pinItem) {
    pinItem.parentElement?.insertBefore(menuItem, pinItem);
  } else {
    const separators = menu.querySelectorAll('[role="separator"]');
    if (separators.length > 0) {
      separators[0].parentElement?.insertBefore(menuItem, separators[0]);
    } else {
      menu.appendChild(menuItem);
    }
  }
};

const initFavouriteMenuItem = (): { dispose: () => void } => {
  const unsubscribe = onPinnedChatsChange(() => {});

  const { dispose: observeDispose } = observe({
    selector: MENU_SELECTOR,
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
    },
  };
};

export { initFavouriteMenuItem };
