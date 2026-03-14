const getFrameDepth = (): number => {
  let depth = 0;
  let w: Window = window;
  while (w !== w.top) {
    depth++;
    w = w.parent;
  }
  return depth;
};

const frameContext = {
  isTop: window === window.top,
  url: location.href,
  depth: getFrameDepth(),
};

export { frameContext };
