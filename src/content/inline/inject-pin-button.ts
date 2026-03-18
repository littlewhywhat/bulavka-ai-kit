import { h } from "preact";
import { mountInline } from "../../common/content/inline/mount";
import { observe } from "../../common/content/inline/observe";
import { isBranchingAvailable } from "../utils/chatgpt";
import { PinButton } from "./components/PinButton";

const ADDED_ATTR = "data-cgpt-pin-added";
const SELECTOR =
  'section[data-turn="assistant"] > div > div > div.justify-start > div';

const initPinButtons = () =>
  observe({
    selector: SELECTOR,
    onElement: (node) => {
      const container = document.createElement("div");

      const candidates = Array.from(
        node.querySelectorAll('[aria-haspopup="menu"]'),
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
