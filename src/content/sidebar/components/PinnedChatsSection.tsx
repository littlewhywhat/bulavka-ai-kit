/** @jsxImportSource preact */

import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { useEffect, useState } from "preact/hooks";
import type { PinnedChat } from "../../../types/messages";
import { getPinnedChats, onPinnedChatsChange } from "../../pinnedChatsStorage";
import { createFolder, getFolders, onFoldersChange } from "../foldersStorage";
import { moveNode } from "../treeMutations";
import {
  addFolderToTree,
  getTree,
  onTreeChange,
  reconcile,
  saveTree,
} from "../treeStorage";
import type { FoldersMap, TreeNode } from "../types";
import { useCollapsed } from "../useCollapsed";
import { useSettingsValue } from "../useSettingsValue";
import { FolderRow } from "./FolderRow";
import { PinnedChatItem } from "./PinnedChatItem";

const PinnedChatsSection = () => {
  const [chats, setChats] = useState<PinnedChat[]>(getPinnedChats);
  const [tree, setTree] = useState<TreeNode[]>(getTree);
  const [folders, setFolders] = useState<FoldersMap>(getFolders);
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useCollapsed(
    "bulavka-favourites-collapsed",
  );
  const initialVisible = useSettingsValue("initialPinnedChatsVisible", 3);
  const sectionEnabled = useSettingsValue("pinnedChatsSectionEnabled", true);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);

  useEffect(() => {
    const unsubChats = onPinnedChatsChange((newChats) => {
      setChats(newChats);
      reconcile(newChats.map((c) => c.conversationId));
    });
    const unsubTree = onTreeChange(setTree);
    const unsubFolders = onFoldersChange(setFolders);
    return () => {
      unsubChats();
      unsubTree();
      unsubFolders();
    };
  }, []);

  useEffect(() => {
    const cleanup = monitorForElements({
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0];
        if (!target) return;

        const sourceData = source.data;
        const targetData = target.data;

        let position: "before" | "after" | "into";

        if (targetData.targetType === "folder") {
          position = targetData.dropAction as "before" | "after" | "into";
        } else {
          const edge = extractClosestEdge(targetData);
          position = edge === "top" ? "before" : "after";
        }

        const currentTree = getTree();
        const newTree = moveNode(currentTree, {
          sourceType: sourceData.sourceType as "chat" | "folder",
          sourceId: sourceData.sourceId as string,
          targetType: targetData.targetType as "chat" | "folder",
          targetId: targetData.targetId as string,
          position,
        });

        if (newTree !== currentTree) {
          saveTree(newTree);
        }
      },
    });

    return cleanup;
  }, []);

  if (!sectionEnabled) return null;
  if (chats.length === 0) return null;

  const chatsMap = new Map(chats.map((c) => [c.conversationId, c]));
  const rootItems = expanded ? tree : tree.slice(0, initialVisible);
  const hasMore = tree.length > initialVisible;

  const handleCreateFolder = async () => {
    const folder = await createFolder("New folder");
    await addFolderToTree(folder.id);
    setRenamingFolderId(folder.id);
  };

  return (
    <div class="group/sidebar-expando-section mb-[var(--sidebar-expanded-section-margin-bottom)]">
      <div class="flex w-full items-center justify-between px-4 py-1.5">
        <button
          type="button"
          aria-expanded={!collapsed}
          class="text-token-text-tertiary flex items-center gap-0.5"
          onClick={() => setCollapsed((c) => !c)}
        >
          <h2 class="__menu-label" data-no-spacing="true">
            Favourites
          </h2>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            aria-hidden="true"
            data-rtl-flip=""
            class={
              collapsed
                ? "h-3 w-3 shrink-0"
                : "invisible h-3 w-3 shrink-0 group-hover/sidebar-expando-section:visible"
            }
          >
            <use
              href={`/cdn/assets/sprites-core-fk4oovux.svg#${collapsed ? "d3876b" : "ba3792"}`}
              fill="currentColor"
            />
          </svg>
        </button>
        {!collapsed && (
          <button
            type="button"
            class="text-token-text-tertiary invisible group-hover/sidebar-expando-section:visible"
            onClick={handleCreateFolder}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </button>
        )}
      </div>
      {!collapsed &&
        rootItems.map((node) => {
          if (node.type === "chat") {
            const chat = chatsMap.get(node.id);
            if (!chat) return null;
            return <PinnedChatItem key={node.id} chat={chat} />;
          }
          const folder = folders[node.id];
          if (!folder) return null;
          return (
            <FolderRow
              key={node.id}
              folder={folder}
              childNodes={node.children}
              chatsMap={chatsMap}
              folders={folders}
              depth={0}
              autoRename={renamingFolderId === node.id}
              onRenameComplete={() => setRenamingFolderId(null)}
              renamingFolderId={renamingFolderId}
            />
          );
        })}
      {!collapsed && hasMore && (
        <button
          type="button"
          class="group __menu-item hoverable gap-1.5 w-full"
          data-sidebar-item="true"
          onClick={(e) => {
            setExpanded((prev) => !prev);
            const btn = e.currentTarget as HTMLElement;
            btn.blur();
            btn.style.pointerEvents = "none";
            requestAnimationFrame(() => {
              btn.style.pointerEvents = "";
            });
          }}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).blur()}
        >
          <div class="flex items-center justify-center group-disabled:opacity-50 group-data-disabled:opacity-50 icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="icon"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </div>
          <div class="flex min-w-0 grow items-center gap-2.5">
            <div class="truncate">{expanded ? "Show less" : "More"}</div>
          </div>
        </button>
      )}
    </div>
  );
};

export { PinnedChatsSection };
