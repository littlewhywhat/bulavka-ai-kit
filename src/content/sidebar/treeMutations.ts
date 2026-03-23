import type { TreeNode } from "./types";

type MoveInstruction = {
  sourceType: "chat" | "folder";
  sourceId: string;
  targetType: "chat" | "folder";
  targetId: string;
  position: "before" | "after" | "into";
};

const findAndRemove = (
  nodes: TreeNode[],
  type: string,
  id: string,
): { nodes: TreeNode[]; removed: TreeNode | null } => {
  const idx = nodes.findIndex((n) => n.type === type && n.id === id);
  if (idx !== -1) {
    const removed = nodes[idx];
    return {
      nodes: [...nodes.slice(0, idx), ...nodes.slice(idx + 1)],
      removed,
    };
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type !== "folder") continue;
    const childIdx = node.children.findIndex(
      (c) => c.type === type && c.id === id,
    );
    if (childIdx === -1) continue;
    const removed = node.children[childIdx];
    const newChildren = [
      ...node.children.slice(0, childIdx),
      ...node.children.slice(childIdx + 1),
    ];
    return {
      nodes: [
        ...nodes.slice(0, i),
        { ...node, children: newChildren },
        ...nodes.slice(i + 1),
      ],
      removed,
    };
  }

  return { nodes, removed: null };
};

const insertAtTarget = (
  nodes: TreeNode[],
  toInsert: TreeNode,
  targetType: string,
  targetId: string,
  position: "before" | "after" | "into",
): TreeNode[] => {
  if (position === "into") {
    return nodes.map((n) =>
      n.type === "folder" && n.id === targetId
        ? { ...n, children: [...n.children, toInsert] }
        : n,
    );
  }

  const rootIdx = nodes.findIndex(
    (n) => n.type === targetType && n.id === targetId,
  );
  if (rootIdx !== -1) {
    const insertIdx = position === "before" ? rootIdx : rootIdx + 1;
    return [...nodes.slice(0, insertIdx), toInsert, ...nodes.slice(insertIdx)];
  }

  return nodes.map((n) => {
    if (n.type !== "folder") return n;
    const childIdx = n.children.findIndex(
      (c) => c.type === targetType && c.id === targetId,
    );
    if (childIdx === -1) return n;
    const insertIdx = position === "before" ? childIdx : childIdx + 1;
    return {
      ...n,
      children: [
        ...n.children.slice(0, insertIdx),
        toInsert,
        ...n.children.slice(insertIdx),
      ],
    };
  });
};

const moveNode = (
  tree: TreeNode[],
  instruction: MoveInstruction,
): TreeNode[] => {
  const { sourceType, sourceId, targetType, targetId, position } = instruction;

  if (sourceType === targetType && sourceId === targetId) return tree;
  if (sourceType === "folder" && position === "into") return tree;

  if (sourceType === "folder") {
    const targetAtRoot = tree.some(
      (n) => n.type === targetType && n.id === targetId,
    );
    if (!targetAtRoot) return tree;

    const folder = tree.find((n) => n.type === "folder" && n.id === sourceId);
    if (
      folder?.type === "folder" &&
      folder.children.some((c) => c.id === targetId)
    )
      return tree;
  }

  const { nodes, removed } = findAndRemove(tree, sourceType, sourceId);
  if (!removed) return tree;

  return insertAtTarget(nodes, removed, targetType, targetId, position);
};

export { moveNode };
export type { MoveInstruction };
