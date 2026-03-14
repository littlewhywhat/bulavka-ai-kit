const onVisible = (
  el: Element,
  callback: () => (() => void) | undefined,
): (() => void) => {
  let mountDispose: (() => void) | undefined;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.disconnect();
        mountDispose = callback();
      }
    }
  });
  observer.observe(el);

  return () => {
    observer.disconnect();
    mountDispose?.();
  };
};

export { onVisible };
