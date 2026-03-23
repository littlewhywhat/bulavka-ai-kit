import type { TreeNode } from "./types";

const STORAGE_KEY = "bulavka-ai-kit-favourites-tree";

type Listener = (tree: TreeNode[]) => void;

let cached: TreeNode[] = [];
let loaded = false;

const getTree = (): TreeNode[] => cached;

const parse = (raw: unknown): TreeNode[] => {
  if (!Array.isArray(raw)) return [];
  return raw as TreeNode[];
};

const load = async (): Promise<TreeNode[]> => {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return parse(result[STORAGE_KEY]);
};

const saveTree = async (tree: TreeNode[]): Promise<void> => {
  cached = tree;
  await chrome.storage.sync.set({ [STORAGE_KEY]: tree });
};

const ensureLoaded = async () => {
  if (!loaded) {
    cached = await load();
    loaded = true;
  }
};

const collectChatIds = (nodes: TreeNode[]): Set<string> => {
  const ids = new Set<string>();
  for (const node of nodes) {
    if (node.type === "chat") {
      ids.add(node.id);
    } else {
      for (const child of node.children) {
        if (child.type === "chat") ids.add(child.id);
      }
    }
  }
  return ids;
};

const pruneTree = (nodes: TreeNode[], validIds: Set<string>): TreeNode[] =>
  nodes
    .map((node): TreeNode | null => {
      if (node.type === "chat") return validIds.has(node.id) ? node : null;
      return {
        ...node,
        children: node.children.filter(
          (c) => c.type === "folder" || validIds.has(c.id),
        ),
      };
    })
    .filter((n): n is TreeNode => n !== null);

const reconcile = async (chatIds: string[]): Promise<TreeNode[]> => {
  await ensureLoaded();
  const validSet = new Set(chatIds);
  const pruned = pruneTree(cached, validSet);
  const existingIds = collectChatIds(pruned);
  const missing = chatIds.filter((id) => !existingIds.has(id));
  const result = [
    ...pruned,
    ...missing.map((id): TreeNode => ({ type: "chat" as const, id })),
  ];

  if (JSON.stringify(result) !== JSON.stringify(cached)) {
    await saveTree(result);
  }

  return result;
};

const addFolderToTree = async (folderId: string): Promise<void> => {
  await ensureLoaded();
  await saveTree([{ type: "folder", id: folderId, children: [] }, ...cached]);
};

const removeFolderFromTree = async (folderId: string): Promise<void> => {
  await ensureLoaded();
  const idx = cached.findIndex((n) => n.type === "folder" && n.id === folderId);
  if (idx === -1) return;
  const folder = cached[idx];
  const children = folder.type === "folder" ? folder.children : [];
  const tree = [...cached];
  tree.splice(idx, 1, ...children);
  await saveTree(tree);
};

const onTreeChange = (cb: Listener): (() => void) => {
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

  load().then((tree) => {
    cached = tree;
    loaded = true;
    cb(cached);
  });

  return () => chrome.storage.onChanged.removeListener(handler);
};

export {
  addFolderToTree,
  collectChatIds,
  getTree,
  onTreeChange,
  reconcile,
  removeFolderFromTree,
  saveTree,
};
