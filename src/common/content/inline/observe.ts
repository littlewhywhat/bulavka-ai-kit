type ObserveConfig = {
  selector: string;
  onElement: (el: Element) => (() => void) | undefined;
  markerAttr: string;
};

const observe = (config: ObserveConfig): { dispose: () => void } => {
  const { selector, onElement, markerAttr } = config;
  const disposers = new Map<Element, () => void>();

  const handleElement = (el: Element) => {
    if (el.hasAttribute(markerAttr)) return;
    el.setAttribute(markerAttr, "1");
    const dispose = onElement(el);
    if (dispose) disposers.set(el, dispose);
  };

  document.querySelectorAll(selector).forEach(handleElement);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches(selector)) handleElement(node);
        for (const el of node.querySelectorAll(selector)) handleElement(el);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return {
    dispose: () => {
      observer.disconnect();
      for (const d of disposers.values()) d();
      disposers.clear();
    },
  };
};

export { observe };
export type { ObserveConfig };
