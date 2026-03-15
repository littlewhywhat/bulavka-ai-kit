import { useState } from "preact/hooks";

const useCollapsed = (
  storageKey: string,
): [boolean, (updater: (prev: boolean) => boolean) => void] => {
  const [collapsed, setCollapsed] = useState(
    () =>
      typeof localStorage !== "undefined" &&
      localStorage.getItem(storageKey) === "true",
  );

  const toggle = (updater: (prev: boolean) => boolean) => {
    setCollapsed((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(storageKey, next ? "true" : "false");
      } catch {}
      return next;
    });
  };

  return [collapsed, toggle];
};

export { useCollapsed };
