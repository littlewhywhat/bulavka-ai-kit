/** @jsxImportSource preact */
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import {
  INITIAL_PINNED_CHATS_VISIBLE,
  type PinnedChat,
} from "../../../types/messages";
import {
  getPinnedChats,
  onPinnedChatsChange,
  removePinnedChat,
  updatePinnedChatTitle,
} from "../../pinnedChatsStorage";
import { navigateToPath } from "../../utils/navigate";

type PinnedChatItemProps = {
  chat: PinnedChat;
  onUnpinClick: (chat: PinnedChat) => void;
};

const PinnedChatItem = ({ chat, onUnpinClick }: PinnedChatItemProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0 });
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    <a
      tabIndex={0}
      data-fill=""
      class="group __menu-item hoverable"
      data-sidebar-item="true"
      href={`/c/${chat.conversationId}`}
      data-discover="true"
      onClick={handleLinkClick}
    >
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
        <div class="trailing text-token-text-tertiary" tabIndex={-1}>
          <span aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              aria-hidden="true"
              class="icon-xs text-token-icon-tertiary opacity-50"
            >
              <use
                href="/cdn/assets/sprites-core-fk4oovux.svg#a8c6bd"
                fill="currentColor"
              />
            </svg>
          </span>
        </div>
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
                onUnpinClick(chat);
              }}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setMenuOpen(false);
                  onUnpinClick(chat);
                }
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
                    href="/cdn/assets/sprites-core-fk4oovux.svg#13322a"
                    fill="currentColor"
                  />
                </svg>
              </div>
              Unpin
            </div>
          </div>
        )}
      </div>
    </a>
  );
};

const PinnedChatsSection = () => {
  const [chats, setChats] = useState<PinnedChat[]>(getPinnedChats);
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => onPinnedChatsChange(setChats), []);

  if (chats.length === 0) return null;

  const visible = expanded
    ? chats
    : chats.slice(0, INITIAL_PINNED_CHATS_VISIBLE);
  const hasMore = chats.length > INITIAL_PINNED_CHATS_VISIBLE;

  return (
    <div class="group/sidebar-expando-section mb-[var(--sidebar-expanded-section-margin-bottom)]">
      <button
        type="button"
        aria-expanded={!collapsed}
        class="text-token-text-tertiary flex w-full items-center justify-start gap-0.5 px-4 py-1.5"
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
              ? "hidden h-3 w-3 shrink-0 group-hover/sidebar-expando-section:block"
              : "invisible h-3 w-3 shrink-0 group-hover/sidebar-expando-section:visible"
          }
        >
          <use
            href={`/cdn/assets/sprites-core-fk4oovux.svg#${collapsed ? "d3876b" : "ba3792"}`}
            fill="currentColor"
          />
        </svg>
      </button>
      {!collapsed &&
        visible.map((chat) => (
          <PinnedChatItem
            key={chat.conversationId}
            chat={chat}
            onUnpinClick={(c) => removePinnedChat(c.conversationId)}
          />
        ))}
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
