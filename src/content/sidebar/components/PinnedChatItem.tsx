/** @jsxImportSource preact */

import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { PinnedChat } from "../../../types/messages";
import {
  requestUnfavourite,
  updatePinnedChatTitle,
} from "../../pinnedChatsStorage";
import { navigateToPath } from "../../utils/navigate";
import { MAX_FOLDER_DEPTH } from "../types";

type PinnedChatItemProps = {
  chat: PinnedChat;
  depth?: number;
};

const PinnedChatItem = ({ chat, depth = 0 }: PinnedChatItemProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [dropEdge, setDropEdge] = useState<"top" | "bottom" | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0 });
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const cleanupDrag = draggable({
      element: el,
      getInitialData: () => ({
        sourceType: "chat",
        sourceId: chat.conversationId,
      }),
      onGenerateDragPreview: ({ nativeSetDragImage, location, source }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: preserveOffsetOnSource({
            element: source.element,
            input: location.current.input,
          }),
          render: ({ container }) => {
            const clone = el.cloneNode(true) as HTMLElement;
            clone.style.width = `${el.offsetWidth}px`;
            clone.style.borderRadius = "10px";
            clone.style.backgroundColor = "var(--bg-primary)";
            clone.style.opacity = "0.9";
            container.appendChild(clone);
          },
        });
      },
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    const cleanupDrop = dropTargetForElements({
      element: el,
      getData: ({ input, element }) =>
        attachClosestEdge(
          { targetType: "chat", targetId: chat.conversationId },
          { input, element, allowedEdges: ["top", "bottom"] },
        ),
      canDrop: ({ source }) => {
        if (source.data.sourceType === "folder") {
          const srcDepth = Number(source.data.sourceFolderDepth) || 1;
          return depth + srcDepth < MAX_FOLDER_DEPTH;
        }
        return true;
      },
      onDragEnter: ({ self }) =>
        setDropEdge(extractClosestEdge(self.data) as "top" | "bottom" | null),
      onDrag: ({ self }) =>
        setDropEdge(extractClosestEdge(self.data) as "top" | "bottom" | null),
      onDragLeave: () => setDropEdge(null),
      onDrop: () => setDropEdge(null),
    });

    return () => {
      cleanupDrag();
      cleanupDrop();
    };
  }, [chat.conversationId, depth]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [menuOpen]);

  useEffect(() => {
    if (renaming && inputRef.current) inputRef.current.focus();
  }, [renaming]);

  const commitRename = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== chat.title) {
      updatePinnedChatTitle(chat.conversationId, trimmed);
    }
    setRenaming(false);
  }, [renameValue, chat]);

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
    setRenameValue(chat.title);
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
    }
  };

  const handleLinkClick = (e: MouseEvent) => {
    if (renaming) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    navigateToPath(`/c/${chat.conversationId}`);
  };

  return (
    <div
      ref={elementRef}
      tabIndex={0}
      data-fill=""
      class="group __menu-item hoverable"
      data-sidebar-item="true"
      onClick={handleLinkClick}
      style={{
        position: "relative",
        ...(isDragging ? { opacity: 0.5 } : {}),
      }}
    >
      {dropEdge === "bottom" && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "2px",
            backgroundColor: "var(--text-accent)",
            zIndex: 1,
            bottom: 0,
          }}
        />
      )}
      <div class="flex min-w-0 grow items-center gap-2.5">
        {renaming ? (
          <input
            ref={inputRef}
            class="w-full border-none bg-transparent p-0 text-sm focus:ring-0"
            type="text"
            value={renameValue}
            name="title-editor"
            onInput={(e: Event) =>
              setRenameValue((e.target as HTMLInputElement).value)
            }
            onBlur={commitRename}
            onKeyDown={handleInputKeyDown}
            onClick={(e: MouseEvent) => e.preventDefault()}
          />
        ) : (
          <div class="truncate">{chat.title || "Untitled chat"}</div>
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
                setMenuOpen(false);
                requestUnfavourite(chat);
              }}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setMenuOpen(false);
                  requestUnfavourite(chat);
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
                  <path d="m10.344 4.688 1.181-2.393a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.237 3.152" />
                  <path d="m17.945 17.945.43 2.505a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a8 8 0 0 0 .4-.099" />
                  <path d="m2 2 20 20" />
                </svg>
              </div>
              Unfavourite
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { PinnedChatItem };
export type { PinnedChatItemProps };
