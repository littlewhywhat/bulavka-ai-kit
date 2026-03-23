type FolderMeta = {
  id: string;
  name: string;
  collapsed: boolean;
};

type FoldersMap = Record<string, FolderMeta>;

type ChatNode = { type: "chat"; id: string };
type FolderNode = { type: "folder"; id: string; children: TreeNode[] };
type TreeNode = ChatNode | FolderNode;

const MAX_FOLDER_DEPTH = 2;

export { MAX_FOLDER_DEPTH };
export type { ChatNode, FolderMeta, FolderNode, FoldersMap, TreeNode };
