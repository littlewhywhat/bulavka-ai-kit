import { useEffect, useState } from "preact/hooks";

const useCollapsed = (
  storageKey: string,
): [boolean, (updater: (prev: boolean) => boolean) => void] => {
  const [collapsed, setCollapsed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(storageKey).then((result) => {
      if (result[storageKey] === true) setCollapsed(true);
      setLoaded(true);
    });
  }, [storageKey]);

  const toggle = (updater: (prev: boolean) => boolean) => {
    setCollapsed((prev) => {
      const next = updater(prev);
      chrome.storage.local.set({ [storageKey]: next });
      return next;
    });
  };

  return [loaded ? collapsed : false, toggle];
};

export { useCollapsed };
