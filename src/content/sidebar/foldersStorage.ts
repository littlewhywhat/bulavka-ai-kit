import type { FolderMeta, FoldersMap } from "./types";

const STORAGE_KEY = "bulavka-ai-kit-folders";

type Listener = (folders: FoldersMap) => void;

let cached: FoldersMap = {};
let loaded = false;

const getFolders = (): FoldersMap => cached;

const parse = (raw: unknown): FoldersMap => {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as FoldersMap;
};

const load = async (): Promise<FoldersMap> => {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return parse(result[STORAGE_KEY]);
};

const save = async (folders: FoldersMap): Promise<void> => {
  cached = folders;
  await chrome.storage.sync.set({ [STORAGE_KEY]: folders });
};

const ensureLoaded = async () => {
  if (!loaded) {
    cached = await load();
    loaded = true;
  }
};

const createFolder = async (name: string): Promise<FolderMeta> => {
  await ensureLoaded();
  const id = crypto.randomUUID();
  const folder: FolderMeta = { id, name, collapsed: false };
  await save({ ...cached, [id]: folder });
  return folder;
};

const renameFolder = async (id: string, name: string): Promise<void> => {
  await ensureLoaded();
  if (!cached[id]) return;
  await save({ ...cached, [id]: { ...cached[id], name } });
};

const deleteFolder = async (id: string): Promise<void> => {
  await ensureLoaded();
  const { [id]: _, ...rest } = cached;
  await save(rest);
};

const toggleFolderCollapsed = async (id: string): Promise<void> => {
  await ensureLoaded();
  if (!cached[id]) return;
  await save({
    ...cached,
    [id]: { ...cached[id], collapsed: !cached[id].collapsed },
  });
};

const onFoldersChange = (cb: Listener): (() => void) => {
  const handler = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName !== "sync" || !changes[STORAGE_KEY]) return;
    cached = parse(changes[STORAGE_KEY].newValue);
    loaded = true;
    cb(cached);
  };
  chrome.storage.onChanged.addListener(handler);

  load().then((folders) => {
    cached = folders;
    loaded = true;
    cb(cached);
  });

  return () => chrome.storage.onChanged.removeListener(handler);
};

export {
  createFolder,
  deleteFolder,
  getFolders,
  onFoldersChange,
  renameFolder,
  toggleFolderCollapsed,
};
