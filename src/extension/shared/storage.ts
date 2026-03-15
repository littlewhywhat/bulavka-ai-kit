import { createStorage } from "../../common/extension/storage";

const defaults: {
  enabled: boolean;
  maxPins: number;
  initialPinsVisible: number;
  maxPinnedChats: number;
  initialPinnedChatsVisible: number;
} = {
  enabled: true,
  maxPins: 5,
  initialPinsVisible: 3,
  maxPinnedChats: 5,
  initialPinnedChatsVisible: 3,
};

export const storage = createStorage(defaults);
export type StorageSchema = typeof defaults;
