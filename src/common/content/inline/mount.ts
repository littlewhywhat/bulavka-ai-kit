import { render, type VNode } from "preact";

const mountInline = <P>(
  container: Element,
  vnode: VNode<P>,
): { dispose: () => void } => {
  render(vnode, container);
  return {
    dispose: () => render(null, container),
  };
};

export { mountInline };
