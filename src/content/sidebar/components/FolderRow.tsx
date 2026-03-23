/** @jsxImportSource preact */
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { PinnedChat } from "../../../types/messages";
import {
  deleteFolder,
  renameFolder,
  toggleFolderCollapsed,
} from "../foldersStorage";
import { removeFolderFromTree } from "../treeStorage";
import type { FolderMeta, TreeNode } from "../types";
import { PinnedChatItem } from "./PinnedChatItem";

type FolderRowProps = {
  folder: FolderMeta;
  childNodes: TreeNode[];
  chatsMap: Map<string, PinnedChat>;
  autoRename?: boolean;
  onRenameComplete?: () => void;
};

const FolderRow = ({
  folder,
  childNodes,
  chatsMap,
  autoRename = false,
  onRenameComplete,
}: FolderRowProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [dropAction, setDropAction] = useState<
    "before" | "after" | "into" | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0 });
  const [renaming, setRenaming] = useState(autoRename);
  const [renameValue, setRenameValue] = useState(folder.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const cleanupDrag = draggable({
      element: el,
      getInitialData: () => ({
        sourceType: "folder",
        sourceId: folder.id,
      }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    const cleanupDrop = dropTargetForElements({
      element: el,
      getData: ({ input, element, source }) => {
        const rect = element.getBoundingClientRect();
        const y = input.clientY - rect.top;
        const ratio = y / rect.height;
        const sourceIsFolder = source.data.sourceType === "folder";

        let action: "before" | "after" | "into";
        if (sourceIsFolder) {
          action = ratio < 0.5 ? "before" : "after";
        } else {
          if (ratio < 0.25) action = "before";
          else if (ratio > 0.75) action = "after";
          else action = "into";
        }

        return {
          targetType: "folder",
          targetId: folder.id,
          dropAction: action,
        };
      },
      canDrop: ({ source }) =>
        !(
          source.data.sourceType === "folder" &&
          source.data.sourceId === folder.id
        ),
      onDragEnter: ({ self }) =>
        setDropAction(self.data.dropAction as "before" | "after" | "into"),
      onDrag: ({ self }) =>
        setDropAction(self.data.dropAction as "before" | "after" | "into"),
      onDragLeave: () => setDropAction(null),
      onDrop: () => setDropAction(null),
    });

    return () => {
      cleanupDrag();
      cleanupDrop();
    };
  }, [folder.id]);

  useEffect(() => {
    if (autoRename) {
      setRenaming(true);
      setRenameValue(folder.name);
    }
  }, [autoRename, folder.name]);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [menuOpen]);

  const commitRename = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== folder.name) {
      renameFolder(folder.id, trimmed);
    }
    setRenaming(false);
    onRenameComplete?.();
  }, [renameValue, folder, onRenameComplete]);

  const handleToggle = () => {
    if (renaming) return;
    toggleFolderCollapsed(folder.id);
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    await removeFolderFromTree(folder.id);
    await deleteFolder(folder.id);
  };

  const handleMenuClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!menuOpen && menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      setMenuPos({ left: rect.left, top: rect.bottom + 4 });
    }
    setMenuOpen((v) => !v);
  };

  const handleStartRename = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    setRenameValue(folder.name);
    setRenaming(true);
  };

  const handleInputKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setRenaming(false);
      onRenameComplete?.();
    }
  };

  const itemCount = childNodes.filter((c) => c.type === "chat").length;

  const dropIndicatorStyle =
    dropAction === "before"
      ? { boxShadow: "inset 0 2px 0 0 #2383e2" }
      : dropAction === "after"
        ? { boxShadow: "inset 0 -2px 0 0 #2383e2" }
        : dropAction === "into"
          ? {
              backgroundColor: "rgba(35, 131, 226, 0.08)",
              borderRadius: "8px",
            }
          : {};

  return (
    <div>
      <div
        ref={headerRef}
        role="treeitem"
        tabIndex={0}
        class="group __menu-item hoverable"
        data-sidebar-item="true"
        onClick={handleToggle}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Enter") handleToggle();
        }}
        style={{
          cursor: "pointer",
          ...(isDragging ? { opacity: 0.5 } : {}),
          ...dropIndicatorStyle,
        }}
      >
        <div class="flex min-w-0 grow items-center gap-1.5">
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
            class="shrink-0 transition-transform"
            style={{
              transform: folder.collapsed ? "rotate(0deg)" : "rotate(90deg)",
            }}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          {renaming ? (
            <input
              ref={inputRef}
              class="w-full border-none bg-transparent p-0 text-sm focus:ring-0"
              type="text"
              value={renameValue}
              onInput={(e: Event) =>
                setRenameValue((e.target as HTMLInputElement).value)
              }
              onBlur={commitRename}
              onKeyDown={handleInputKeyDown}
              onClick={(e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          ) : (
            <div class="truncate">{folder.name}</div>
          )}
          {folder.collapsed && itemCount > 0 && (
            <span class="text-token-text-tertiary text-xs shrink-0">
              {itemCount}
            </span>
          )}
        </div>
        <div class="trailing-pair">
          <div class="trailing highlight text-token-text-tertiary">
            <button
              ref={menuBtnRef}
              tabIndex={0}
              data-trailing-button=""
              class="__menu-item-trailing-btn"
              type="button"
              onClick={handleMenuClick}
            >
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  aria-hidden="true"
                  class="icon"
                >
                  <use
                    href="/cdn/assets/sprites-core-fk4oovux.svg#f6d0e2"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </button>
          </div>
          <div class="trailing text-token-text-tertiary" tabIndex={-1} />
          {menuOpen && (
            <div
              ref={menuRef}
              role="menu"
              aria-orientation="vertical"
              onMouseLeave={() => setMenuOpen(false)}
              class="z-50 flex flex-col max-w-xs rounded-2xl popover bg-token-main-surface-primary dark:bg-[#353535] shadow-long py-1.5 px-1.5"
              tabIndex={-1}
              style={{
                position: "fixed",
                left: `${menuPos.left}px`,
                top: `${menuPos.top}px`,
                zIndex: 50,
                minWidth: "max-content",
                outline: "none",
              }}
            >
              <div
                role="menuitem"
                tabIndex={0}
                class="group __menu-item hoverable gap-1.5 w-full"
                onClick={handleStartRename}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === "Enter")
                    handleStartRename(e as unknown as MouseEvent);
                }}
              >
                <div class="flex items-center justify-center group-disabled:opacity-50 group-data-disabled:opacity-50 icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    aria-hidden="true"
                    class="icon"
                  >
                    <use
                      href="/cdn/assets/sprites-core-fk4oovux.svg#6d87e1"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                Rename
              </div>
              <div
                role="menuitem"
                tabIndex={0}
                data-color="danger"
                class="group __menu-item hoverable gap-1.5 w-full"
                onClick={(e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete();
                }}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleDelete();
                  }
                }}
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
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </div>
                Delete
              </div>
            </div>
          )}
        </div>
      </div>
      {!folder.collapsed && (
        <div class="pl-5">
          {childNodes.map((child) => {
            if (child.type !== "chat") return null;
            const chat = chatsMap.get(child.id);
            if (!chat) return null;
            return <PinnedChatItem key={child.id} chat={chat} depth={1} />;
          })}
        </div>
      )}
    </div>
  );
};

export { FolderRow };
