import { createStorage } from "../../common/extension/storage";

const defaults = {
  enabled: true,
} as const;

export const storage = createStorage(defaults);
export type StorageSchema = typeof defaults;
