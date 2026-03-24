/** @jsxImportSource preact */
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { PinnedChat } from "../../../types/messages";
import {
  deleteFolder,
  renameFolder,
  toggleFolderCollapsed,
} from "../foldersStorage";
import { getFolderDepth } from "../treeMutations";
import { removeFolderFromTree } from "../treeStorage";
import type { FolderMeta, FoldersMap, TreeNode } from "../types";
import { MAX_FOLDER_DEPTH } from "../types";
import { PinnedChatItem } from "./PinnedChatItem";

type FolderRowProps = {
  folder: FolderMeta;
  childNodes: TreeNode[];
  chatsMap: Map<string, PinnedChat>;
  folders: FoldersMap;
  depth?: number;
  autoRename?: boolean;
  onRenameComplete?: () => void;
  renamingFolderId?: string | null;
};

const FolderRow = ({
  folder,
  childNodes,
  chatsMap,
  folders,
  depth = 0,
  autoRename = false,
  onRenameComplete,
  renamingFolderId = null,
}: FolderRowProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [dropAction, setDropAction] = useState<
    "before" | "after" | "into" | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const suppressHover = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0 });
  const [renaming, setRenaming] = useState(autoRename);
  const [renameValue, setRenameValue] = useState(folder.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sourceFolderDepth = getFolderDepth({
    type: "folder",
    id: folder.id,
    children: childNodes,
  });

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const cleanupDrag = draggable({
      element: el,
      getInitialData: () => ({
        sourceType: "folder",
        sourceId: folder.id,
        sourceFolderDepth,
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
      getData: ({ input, element, source }) => {
        const rect = element.getBoundingClientRect();
        const y = input.clientY - rect.top;
        const ratio = y / rect.height;
        const sourceIsFolder = source.data.sourceType === "folder";

        const srcFolderDepth = sourceIsFolder
          ? Number(source.data.sourceFolderDepth) || 1
          : 0;
        const canAcceptInto = depth + 1 + srcFolderDepth < MAX_FOLDER_DEPTH;

        let action: "before" | "after" | "into";
        if (sourceIsFolder && !canAcceptInto) {
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
      canDrop: ({ source }) => {
        if (
          source.data.sourceType === "folder" &&
          source.data.sourceId === folder.id
        )
          return false;
        if (source.data.sourceType === "folder") {
          const srcDepth = Number(source.data.sourceFolderDepth) || 1;
          return depth + srcDepth < MAX_FOLDER_DEPTH;
        }
        return true;
      },
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
  }, [folder.id, depth, sourceFolderDepth]);

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
    if (!folder.collapsed) {
      suppressHover.current = true;
      setHovered(false);
    }
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
    dropAction === "into"
      ? {
          backgroundColor: "color-mix(in srgb, var(--text-accent) 8%, transparent)",
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
        onClick={(e: MouseEvent) => {
          handleToggle();
          (e.currentTarget as HTMLElement).blur();
        }}
        onMouseEnter={() => {
          if (!suppressHover.current) setHovered(true);
        }}
        onMouseLeave={() => {
          suppressHover.current = false;
          setHovered(false);
        }}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Enter") handleToggle();
        }}
        style={{
          cursor: "pointer",
          position: "relative",
          ...(isDragging ? { opacity: 0.5 } : {}),
          ...dropIndicatorStyle,
        }}
      >
        {dropAction === "after" && (
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
        <div class="flex min-w-0 grow items-center gap-1.5">
          {folder.collapsed && !hovered ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              aria-hidden="true"
              class="shrink-0 icon"
            >
              <use
                href="/cdn/assets/sprites-core-lbtco6v1.svg#61ee0c"
                fill="currentColor"
              />
            </svg>
          ) : folder.collapsed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 20 20"
              width="20"
              height="20"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
              class="shrink-0"
            >
              <g>
                <g
                  transform="matrix(1,0,0,1,0,0)"
                  opacity="1"
                  style="display: block"
                >
                  <g
                    opacity="1"
                    transform="matrix(1.0109593868255615,-0.0020312005653977394,0.059131428599357605,0.9890406131744385,1.9619638919830322,3.6605772972106934)"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="miter"
                      fill-opacity="0"
                      stroke-miterlimit="4"
                      stroke="currentColor"
                      stroke-opacity="1"
                      stroke-width="1.33"
                      d=" M14.49899959564209,4.953000068664551 C14.496000289916992,3.930000066757202 14.467000007629395,3.365999937057495 14.241000175476074,2.921999931335449 C14.013400077819824,2.4748899936676025 13.650099754333496,2.111560106277466 13.203200340270996,1.8838599920272827 C12.695199966430664,1.625 12.030099868774414,1.625 10.699999809265137,1.625 C9.931366920471191,1.625 9.16273307800293,1.625 8.394100189208984,1.625 C8.242400169372559,1.625 8.166600227355957,1.625 8.093500137329102,1.6204999685287476 C7.561999797821045,1.5877100229263306 7.056839942932129,1.377210021018982 6.6593098640441895,1.0228099822998047 C6.604680061340332,0.974120020866394 6.551270008087158,0.9202499985694885 6.444439888000488,0.8125 C6.444439888000488,0.8125 6.444439888000488,0.8125 6.444439888000488,0.8125 C6.337619781494141,0.7047500014305115 6.284210205078125,0.650879979133606 6.229579925537109,0.6021900177001953 C5.83204984664917,0.24778999388217926 5.326930046081543,0.037289999425411224 4.795370101928711,0.0044999998062849045 C4.722330093383789,0 4.646470069885254,0 4.494740009307861,0 C4.263160228729248,0 4.031579971313477,0 3.799999952316284,0 C2.4698801040649414,0 1.8048100471496582,0 1.2967699766159058,0.2588599920272827 C0.8498899936676025,0.48655998706817627 0.48655998706817627,0.8498899936676025 0.2588599920272827,1.2967699766159058 C0,1.8048100471496582 0,2.469870090484619 0,3.799999952316284 C0,5.599999904632568 0,7.400000095367432 0,9.199999809265137 C0,10.530099868774414 0,11.195199966430664 0.2588599920272827,11.703200340270996 C0.48655998706817627,12.150099754333496 0.8498899936676025,12.513400077819824 1.2967699766159058,12.741100311279297 C1.8048100471496582,13 2.4698801040649414,13 3.799999952316284,13 C4.616666793823242,13 5.433333396911621,13 6.25,13"
                    />
                  </g>
                </g>
                <g
                  transform="matrix(1,0,0,1,0,0)"
                  opacity="1"
                  style="display: block"
                >
                  <g
                    opacity="1"
                    transform="matrix(1,0,-0.18112987279891968,1,3.978959083557129,9.113489151000977)"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="miter"
                      fill-opacity="0"
                      stroke-miterlimit="4"
                      stroke="currentColor"
                      stroke-opacity="1"
                      stroke-width="1.33"
                      d=" M0.5920000076293945,0 C0.38477998971939087,0 0.2811700105667114,0 0.20202000439167023,0.03819209709763527 C0.1324000060558319,0.07178182154893875 0.07580000162124634,0.1253909170627594 0.04033000022172928,0.19132034480571747 C0,0.2662651240825653 0,0.36438271403312683 0,0.5606179237365723 C0,1.6363952159881592 0,2.712172269821167 0,3.787949562072754 C0,5.047540664672852 0,5.6773834228515625 0.2588599920272827,6.158454418182373 C0.48655998706817627,6.581664085388184 0.8498899936676025,6.925800323486328 1.2967699766159058,7.141429901123047 C1.8048100471496582,7.386510848999023 2.4698801040649414,7.386510848999023 3.799999952316284,7.386510848999023 C6.099999904632568,7.386510848999023 8.399999618530273,7.386510848999023 10.699999809265137,7.386510848999023 C12.030099868774414,7.386510848999023 12.695199966430664,7.386510848999023 13.203200340270996,7.141429901123047 C13.650099754333496,6.925800323486328 14.013400077819824,6.581664085388184 14.241100311279297,6.158454418182373 C14.5,5.6773834228515625 14.5,5.047540664672852 14.5,3.787949562072754 C14.5,2.712172269821167 14.5,1.6363952159881592 14.5,0.5606179237365723 C14.5,0.36438271403312683 14.5,0.2662651240825653 14.459699630737305,0.19132034480571747 C14.424200057983398,0.1253909170627594 14.367600440979004,0.07178182154893875 14.29800033569336,0.03819209709763527 C14.218799591064453,0 14.11520004272461,0 13.907999992370605,0 C9.46933364868164,0 5.030666828155518,0 0.5920000076293945,0 C0.5920000076293945,0 0.5920000076293945,0 0.5920000076293945,0 C0.5920000076293945,0 0.5920000076293945,0 0.5920000076293945,0z"
                    />
                  </g>
                </g>
              </g>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 20 20"
              width="20"
              height="20"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
              class="shrink-0"
            >
              <g clip-path="url(#__lottie_element_34)">
                <g
                  transform="matrix(1,0,0,1,0,0)"
                  opacity="1"
                  style="display: block"
                >
                  <g
                    opacity="1"
                    transform="matrix(1.0285816192626953,-0.006075212266296148,0.13446564972400665,0.9714184403419495,0.7259734272956848,3.885779857635498)"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="miter"
                      fill-opacity="0"
                      stroke-miterlimit="4"
                      stroke="currentColor"
                      stroke-opacity="1"
                      stroke-width="1.33"
                      d=" M14.5,5.644999980926514 C14.5,5.572000026702881 14.5,5.498000144958496 14.5,5.425000190734863 C14.5,4.094880104064941 14.5,3.429810047149658 14.241100311279297,2.9217700958251953 C14.013400077819824,2.4748899936676025 13.650099754333496,2.111560106277466 13.203200340270996,1.8838599920272827 C12.695199966430664,1.625 12.030099868774414,1.625 10.699999809265137,1.625 C9.931366920471191,1.625 9.16273307800293,1.625 8.394100189208984,1.625 C8.242400169372559,1.625 8.166600227355957,1.625 8.093500137329102,1.6204999685287476 C7.561999797821045,1.5877100229263306 7.056839942932129,1.377210021018982 6.6593098640441895,1.0228099822998047 C6.604680061340332,0.974120020866394 6.551270008087158,0.9202499985694885 6.444439888000488,0.8125 C6.444439888000488,0.8125 6.444439888000488,0.8125 6.444439888000488,0.8125 C6.337619781494141,0.7047500014305115 6.284210205078125,0.650879979133606 6.229579925537109,0.6021900177001953 C5.83204984664917,0.24778999388217926 5.326930046081543,0.037289999425411224 4.795370101928711,0.0044999998062849045 C4.722330093383789,0 4.646470069885254,0 4.494740009307861,0 C4.263160228729248,0 4.031579971313477,0 3.799999952316284,0 C2.4698801040649414,0 1.8048100471496582,0 1.2967699766159058,0.2588599920272827 C0.8498899936676025,0.48655998706817627 0.48655998706817627,0.8498899936676025 0.2588599920272827,1.2967699766159058 C0,1.8048100471496582 0,2.469870090484619 0,3.799999952316284 C0,5.599999904632568 0,7.400000095367432 0,9.199999809265137 C0,10.530099868774414 0,11.195199966430664 0.2588599920272827,11.703200340270996 C0.48655998706817627,12.150099754333496 0.8498899936676025,12.513400077819824 1.2967699766159058,12.741100311279297 C1.8048100471496582,13 2.4698801040649414,13 3.799999952316284,13 C4.616666793823242,13 5.433333396911621,13 6.25,13"
                    />
                  </g>
                </g>
                <g
                  transform="matrix(1,0,0,1,0,0)"
                  opacity="1"
                  style="display: block"
                >
                  <g
                    opacity="1"
                    transform="matrix(1,0,-0.3057306706905365,1,4.790250301361084,9.694989204406738)"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="miter"
                      fill-opacity="0"
                      stroke-miterlimit="4"
                      stroke="currentColor"
                      stroke-opacity="1"
                      stroke-width="1.33"
                      d=" M0.5920000076293945,0 C0.38477998971939087,0 0.2811700105667114,0 0.20202000439167023,0.03518543392419815 C0.1324000060558319,0.06613081693649292 0.07580000162124634,0.11551953852176666 0.04033000022172928,0.17625868320465088 C0,0.2453034520149231 0,0.3356967568397522 0,0.5164834260940552 C0,1.5075702667236328 0,2.4986572265625 0,3.489743947982788 C0,4.650174140930176 0,5.230432510375977 0.2588599920272827,5.673631191253662 C0.48655998706817627,6.063523769378662 0.8498899936676025,6.380568027496338 1.2967699766159058,6.579222202301025 C1.8048100471496582,6.805009365081787 2.4698801040649414,6.805009365081787 3.799999952316284,6.805009365081787 C6.099999904632568,6.805009365081787 8.399999618530273,6.805009365081787 10.699999809265137,6.805009365081787 C12.030099868774414,6.805009365081787 12.695199966430664,6.805009365081787 13.203200340270996,6.579222202301025 C13.650099754333496,6.380568027496338 14.013400077819824,6.063523769378662 14.241100311279297,5.673631191253662 C14.5,5.230432510375977 14.5,4.650174140930176 14.5,3.489743947982788 C14.5,2.4986572265625 14.5,1.5075702667236328 14.5,0.5164834260940552 C14.5,0.3356967568397522 14.5,0.2453034520149231 14.459699630737305,0.17625868320465088 C14.424200057983398,0.11551953852176666 14.367600440979004,0.06613081693649292 14.29800033569336,0.03518543392419815 C14.218799591064453,0 14.11520004272461,0 13.907999992370605,0 C9.46933364868164,0 5.030666828155518,0 0.5920000076293945,0 C0.5920000076293945,0 0.5920000076293945,0 0.5920000076293945,0 C0.5920000076293945,0 0.5920000076293945,0 0.5920000076293945,0z"
                    />
                  </g>
                </g>
              </g>
            </svg>
          )}
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
        <div style={{ paddingLeft: "20px" }}>
          {childNodes.map((child) => {
            if (child.type === "chat") {
              const chat = chatsMap.get(child.id);
              if (!chat) return null;
              return (
                <PinnedChatItem key={child.id} chat={chat} depth={depth + 1} />
              );
            }
            if (child.type === "folder") {
              const childFolder = folders[child.id];
              if (!childFolder) return null;
              return (
                <FolderRow
                  key={child.id}
                  folder={childFolder}
                  childNodes={child.children}
                  chatsMap={chatsMap}
                  folders={folders}
                  depth={depth + 1}
                  autoRename={renamingFolderId === child.id}
                  onRenameComplete={onRenameComplete}
                  renamingFolderId={renamingFolderId}
                />
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export { FolderRow };
