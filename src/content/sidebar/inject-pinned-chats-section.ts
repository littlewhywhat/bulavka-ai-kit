import { h } from "preact";
import { mountInline } from "../../common/content/inline/mount";
import { PinnedChatsSection } from "./components/PinnedChatsSection";

const MARKER = "data-bulavka-pinned-chats";

const findChatsSection = (): Element | null =>
  document
    .querySelector("div#history")
    ?.closest(".group\\/sidebar-expando-section") ?? null;

const preventNativeDrag = (e: Event) => {
  e.preventDefault();
  e.stopImmediatePropagation();
};

const inject = (): (() => void) | null => {
  const chatsSection = findChatsSection();
  if (!chatsSection || chatsSection.hasAttribute(MARKER)) return null;
  chatsSection.setAttribute(MARKER, "1");

  const historyEl = chatsSection.querySelector("div#history");
  historyEl?.addEventListener("dragstart", preventNativeDrag, true);

  const container = document.createElement("div");
  chatsSection.parentElement?.insertBefore(container, chatsSection);

  const { dispose } = mountInline(container, h(PinnedChatsSection, {}));

  return () => {
    dispose();
    historyEl?.removeEventListener("dragstart", preventNativeDrag, true);
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
