import { h, render, type VNode } from "preact";

const mountFloating = (
  // biome-ignore lint/suspicious/noExplicitAny: VNode type parameter is contravariant
  vnode: VNode<any>,
  hostStyles: string,
  shadowStyles?: string,
): { host: HTMLDivElement; shadow: ShadowRoot; dispose: () => void } => {
  const host = document.createElement("div");
  host.style.cssText = hostStyles;
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  if (shadowStyles) {
    const style = document.createElement("style");
    style.textContent = shadowStyles;
    shadow.appendChild(style);
  }
  render(h("div", { style: "width:100%;height:100%;" }, vnode), shadow);

  return {
    host,
    shadow,
    dispose: () => {
      render(null, shadow);
      host.remove();
    },
  };
};

export { mountFloating };
