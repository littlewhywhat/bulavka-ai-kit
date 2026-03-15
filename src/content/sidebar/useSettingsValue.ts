import { useEffect, useState } from "preact/hooks";

const useSettingsValue = <T extends number | boolean>(
  key: string,
  defaultValue: T,
): T => {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    chrome.storage.local.get(key).then((result) => {
      if (result[key] !== undefined) setValue(result[key] as T);
    });

    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName !== "local" || !changes[key]) return;
      setValue((changes[key].newValue as T) ?? defaultValue);
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, [key, defaultValue]);

  return value;
};

export { useSettingsValue };
