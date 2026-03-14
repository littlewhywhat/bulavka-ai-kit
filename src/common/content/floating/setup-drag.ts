const setupDrag = (
  host: HTMLElement,
  handleRoot: Element | ShadowRoot,
  options?: { selector?: string },
): (() => void) => {
  const selector = options?.selector ?? "[data-drag-handle]";
  const handle = handleRoot.querySelector(selector);
  if (!handle) return () => {};

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const onMouseDown = (e: MouseEvent) => {
    isDragging = true;
    const rect = host.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    host.style.transition = "none";
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    host.style.left = `${e.clientX - offsetX}px`;
    host.style.top = `${e.clientY - offsetY}px`;
    host.style.right = "auto";
    host.style.bottom = "auto";
    host.style.transform = "none";
  };

  const onMouseUp = () => {
    isDragging = false;
  };

  handle.addEventListener("mousedown", onMouseDown as EventListener);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  return () => {
    handle.removeEventListener("mousedown", onMouseDown as EventListener);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };
};

export { setupDrag };
