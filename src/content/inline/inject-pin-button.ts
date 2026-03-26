import { h } from "preact";
import { mountInline } from "../../common/content/inline/mount";
import { observe } from "../../common/content/inline/observe";
import { chatgptConfig } from "../chatgpt-config";
import { isBranchingAvailable } from "../utils/chatgpt";
import { PinButton } from "./components/PinButton";

const ADDED_ATTR = "data-cgpt-pin-added";

const initPinButtons = () =>
  observe({
    selector: chatgptConfig.selectors.assistantToolbarRow,
    onElement: (node) => {
      const container = document.createElement("div");

      const candidates = Array.from(
        node.querySelectorAll(chatgptConfig.selectors.menuTriggerInToolbar),
      );
      const target =
        candidates.find((el) => !el.closest("span")) ?? candidates[0] ?? null;
      let beforeEl: Element | null = target;
      while (beforeEl?.parentElement && beforeEl.parentElement !== node) {
        beforeEl = beforeEl.parentElement;
      }

      if (beforeEl?.parentElement === node)
        node.insertBefore(container, beforeEl);
      else if (node.lastElementChild)
        node.insertBefore(container, node.lastElementChild);
      else node.appendChild(container);

      const { dispose } = mountInline(
        container,
        h(PinButton, { available: isBranchingAvailable() }),
      );

      return () => {
        dispose();
        container.remove();
      };
    },
    markerAttr: ADDED_ATTR,
  });

export { initPinButtons };
