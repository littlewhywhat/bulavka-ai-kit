import { h } from "preact";
import { mountInline } from "../../common/content/inline/mount";
import { PinnedChatsSection } from "./components/PinnedChatsSection";

const MARKER = "data-bulavka-pinned-chats";

const findYourChatsSection = (): Element | null => {
  const headers = document.querySelectorAll(
    ".group\\/sidebar-expando-section h2.__menu-label",
  );
  for (const header of headers) {
    if (header.textContent?.trim().toLowerCase() === "your chats") {
      return header.closest(".group\\/sidebar-expando-section");
    }
  }
  return null;
};

const inject = (): (() => void) | null => {
  const chatsSection = findYourChatsSection();
  if (!chatsSection || chatsSection.hasAttribute(MARKER)) return null;
  chatsSection.setAttribute(MARKER, "1");

  const container = document.createElement("div");
  chatsSection.parentElement?.insertBefore(container, chatsSection);

  const { dispose } = mountInline(container, h(PinnedChatsSection, {}));

  return () => {
    dispose();
    container.remove();
    chatsSection.removeAttribute(MARKER);
  };
};

const injectPinnedChatsSection = (): { dispose: () => void } => {
  let cleanup: (() => void) | null = inject();

  const observer = new MutationObserver(() => {
    if (document.querySelector(`[${MARKER}]`)) return;
    cleanup?.();
    cleanup = inject();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return {
    dispose: () => {
      observer.disconnect();
      cleanup?.();
    },
  };
};

export { injectPinnedChatsSection };
