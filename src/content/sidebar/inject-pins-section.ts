import { h } from "preact";
import { mountInline } from "../../common/content/inline/mount";
import { chatgptConfig } from "../chatgpt-config";
import { PinsSection } from "./components/PinsSection";

const MARKER = "data-bulavka-pins";

const findChatsSection = (): Element | null =>
  document
    .querySelector(chatgptConfig.selectors.historyContainer)
    ?.closest(chatgptConfig.selectors.expandoSection) ?? null;

const inject = (): (() => void) | null => {
  const chatsSection = findChatsSection();
  if (!chatsSection || chatsSection.hasAttribute(MARKER)) return null;
  chatsSection.setAttribute(MARKER, "1");

  const container = document.createElement("div");
  chatsSection.parentElement?.insertBefore(container, chatsSection);

  const { dispose } = mountInline(container, h(PinsSection, {}));

  return () => {
    dispose();
    container.remove();
    chatsSection.removeAttribute(MARKER);
  };
};

const injectPinsSection = (): { dispose: () => void } => {
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

export { injectPinsSection };
