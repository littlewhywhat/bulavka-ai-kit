import type { TreeNode } from "./types";
import { MAX_FOLDER_DEPTH } from "./types";

type MoveInstruction = {
  sourceType: "chat" | "folder";
  sourceId: string;
  targetType: "chat" | "folder";
  targetId: string;
  position: "before" | "after" | "into";
};

const getFolderDepth = (node: TreeNode): number => {
  if (node.type === "chat") return 0;
  if (node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(getFolderDepth));
};

const findNodeDepth = (
  nodes: TreeNode[],
  type: string,
  id: string,
  depth = 0,
): number => {
  for (const node of nodes) {
    if (node.type === type && node.id === id) return depth;
    if (node.type === "folder") {
      const d = findNodeDepth(node.children, type, id, depth + 1);
      if (d !== -1) return d;
    }
  }
  return -1;
};

const isDescendantOf = (
  nodes: TreeNode[],
  ancestorId: string,
  targetType: string,
  targetId: string,
): boolean => {
  for (const node of nodes) {
    if (node.type === "folder" && node.id === ancestorId) {
      return containsNode(node.children, targetType, targetId);
    }
    if (node.type === "folder") {
      const found = isDescendantOf(
        node.children,
        ancestorId,
        targetType,
        targetId,
      );
      if (found) return found;
    }
  }
  return false;
};

const containsNode = (nodes: TreeNode[], type: string, id: string): boolean => {
  for (const node of nodes) {
    if (node.type === type && node.id === id) return true;
    if (node.type === "folder" && containsNode(node.children, type, id))
      return true;
  }
  return false;
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
    const result = findAndRemove(node.children, type, id);
    if (!result.removed) continue;
    return {
      nodes: [
        ...nodes.slice(0, i),
        { ...node, children: result.nodes },
        ...nodes.slice(i + 1),
      ],
      removed: result.removed,
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
    return nodes.map((n) => {
      if (n.type === "folder" && n.id === targetId)
        return { ...n, children: [...n.children, toInsert] };
      if (n.type === "folder") {
        const updated = insertAtTarget(
          n.children,
          toInsert,
          targetType,
          targetId,
          position,
        );
        if (updated !== n.children) return { ...n, children: updated };
      }
      return n;
    });
  }

  const idx = nodes.findIndex(
    (n) => n.type === targetType && n.id === targetId,
  );
  if (idx !== -1) {
    const insertIdx = position === "before" ? idx : idx + 1;
    return [...nodes.slice(0, insertIdx), toInsert, ...nodes.slice(insertIdx)];
  }

  return nodes.map((n) => {
    if (n.type !== "folder") return n;
    const updated = insertAtTarget(
      n.children,
      toInsert,
      targetType,
      targetId,
      position,
    );
    if (updated !== n.children) return { ...n, children: updated };
    return n;
  });
};

const moveNode = (
  tree: TreeNode[],
  instruction: MoveInstruction,
): TreeNode[] => {
  const { sourceType, sourceId, targetType, targetId, position } = instruction;

  if (sourceType === targetType && sourceId === targetId) return tree;

  if (
    sourceType === "folder" &&
    isDescendantOf(tree, sourceId, targetType, targetId)
  )
    return tree;

  const targetDepth = findNodeDepth(tree, targetType, targetId);
  if (targetDepth === -1) return tree;

  if (sourceType === "folder") {
    const sourceNode = tree
      .flatMap(function flat(n): TreeNode[] {
        if (n.type === "folder" && n.id === sourceId) return [n];
        if (n.type === "folder") return n.children.flatMap(flat);
        return [];
      })
      .at(0);
    if (!sourceNode) return tree;

    const sourceFolderDepth = getFolderDepth(sourceNode);
    const newDepth = position === "into" ? targetDepth + 1 : targetDepth;
    if (newDepth + sourceFolderDepth >= MAX_FOLDER_DEPTH) return tree;
  }

  if (sourceType === "chat" && position === "into") {
    if (targetType !== "folder") return tree;
  }

  const { nodes, removed } = findAndRemove(tree, sourceType, sourceId);
  if (!removed) return tree;

  return insertAtTarget(nodes, removed, targetType, targetId, position);
};

export { getFolderDepth, moveNode };
export type { MoveInstruction };
