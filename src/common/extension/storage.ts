type StorageArea = "local" | "sync" | "session";

type CreateStorageOptions = {
  area?: StorageArea;
};

const createStorage = <S extends Record<string, unknown>>(
  defaults: S,
  options?: CreateStorageOptions,
) => {
  const area = options?.area ?? "local";
  const storage = chrome.storage[area];

  const get = async <K extends keyof S>(key: K): Promise<S[K]> => {
    const keyStr = key as string;
    const result = await storage.get(keyStr);
    const value = result[keyStr];
    return (value as S[K]) ?? defaults[key];
  };

  const set = async <K extends keyof S>(key: K, value: S[K]): Promise<void> => {
    await storage.set({ [key as string]: value });
  };

  const getAll = async (): Promise<S> => {
    const result = await storage.get(null);
    return { ...defaults, ...result } as S;
  };

  return { get, set, getAll };
};

export { createStorage };
export type { CreateStorageOptions, StorageArea };
