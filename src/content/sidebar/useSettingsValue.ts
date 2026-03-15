import { useEffect, useState } from "preact/hooks";

const useSettingsValue = (key: string, defaultValue: number): number => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    chrome.storage.local.get(key).then((result) => {
      if (result[key] !== undefined) setValue(result[key] as number);
    });

    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName !== "local" || !changes[key]) return;
      setValue((changes[key].newValue as number) ?? defaultValue);
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, [key, defaultValue]);

  return value;
};

export { useSettingsValue };
