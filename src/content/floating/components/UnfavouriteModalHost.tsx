/** @jsxImportSource preact */
import { useEffect, useState } from "preact/hooks";
import type { PinnedChat } from "../../../types/messages";
import { onContentMessage } from "../../messaging";
import { removePinnedChat } from "../../pinnedChatsStorage";

type ModalState =
  | { kind: "unfavourite"; chat: PinnedChat }
  | { kind: "limit"; max: number };

const BACKDROP_CLASS =
  "fixed inset-0 z-50 w-full h-full border-none cursor-default before:starting:backdrop-blur-0 before:absolute before:inset-0 before:bg-gray-200/50 before:backdrop-blur-[1px] not-motion-reduce:before:transition not-motion-reduce:before:duration-250 dark:before:bg-black/50 before:starting:opacity-0";
const DIALOG_CLASS =
  "popover bg-token-bg-primary rounded-2xl shadow-long flex flex-col max-w-md w-full overflow-hidden pointer-events-auto";

const UnfavouriteModalHost = () => {
  const [modal, setModal] = useState<ModalState | null>(null);

  useEffect(() => {
    const unsub1 = onContentMessage("show-unfavourite-modal", (c) => {
      setModal({ kind: "unfavourite", chat: c });
      return undefined;
    });
    const unsub2 = onContentMessage("show-favourite-limit-modal", ({ max }) => {
      setModal({ kind: "limit", max });
      return undefined;
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  if (!modal) return null;

  const close = () => setModal(null);

  return (
    <div
      class="fixed inset-0 z-[9999]"
      style={{ pointerEvents: "auto" }}
      data-testid={
        modal.kind === "unfavourite"
          ? "modal-unfavourite-confirmation"
          : "modal-favourite-limit"
      }
    >
      <button
        type="button"
        data-state="open"
        class={BACKDROP_CLASS}
        style={{ pointerEvents: "auto" }}
        onClick={close}
      />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ pointerEvents: "none" }}
      >
        <div
          role="dialog"
          class={DIALOG_CLASS}
          tabIndex={-1}
          onClick={(e: MouseEvent) => e.stopPropagation()}
          onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
        >
          {modal.kind === "unfavourite" ? (
            <UnfavouriteContent chat={modal.chat} onClose={close} />
          ) : (
            <LimitContent max={modal.max} onClose={close} />
          )}
        </div>
      </div>
    </div>
  );
};

const UnfavouriteContent = ({
  chat,
  onClose,
}: {
  chat: PinnedChat;
  onClose: () => void;
}) => {
  const handleConfirm = () => {
    removePinnedChat(chat.conversationId);
    onClose();
  };

  return (
    <>
      <header class="min-h-header-height flex justify-between p-2.5 ps-4 select-none">
        <h2 class="text-token-text-primary text-lg font-normal">
          Remove from Favourites?
        </h2>
      </header>
      <div class="grow overflow-y-auto p-4 pt-1 min-w-0">
        <div class="flex gap-1 min-w-0">
          <span class="shrink-0">This will remove</span>
          <strong
            class="truncate min-w-0"
            title={chat.title || "Untitled chat"}
          >
            {chat.title || "Untitled chat"}
          </strong>
          <span class="shrink-0">from Favourites.</span>
        </div>
      </div>
      <div class="flex w-full flex-row items-center text-sm select-none justify-end p-4 pt-0">
        <div class="flex flex-col gap-3 sm:flex-row-reverse flex w-full flex-row-reverse">
          <button
            type="button"
            class="btn relative btn-danger"
            data-testid="unfavourite-confirm-button"
            onClick={handleConfirm}
          >
            <div class="flex items-center justify-center">Unfavourite</div>
          </button>
          <button
            type="button"
            class="btn relative btn-secondary"
            onClick={onClose}
          >
            <div class="flex items-center justify-center">Cancel</div>
          </button>
        </div>
      </div>
    </>
  );
};

const LimitContent = ({
  max,
  onClose,
}: {
  max: number;
  onClose: () => void;
}) => (
  <>
    <header class="min-h-header-height flex justify-between p-2.5 ps-4 select-none">
      <h2 class="text-token-text-primary text-lg font-normal">
        Favourite limit reached
      </h2>
    </header>
    <div class="grow overflow-y-auto p-4 pt-1 min-w-0">
      <p class="text-token-text-secondary text-sm mb-2">
        {`You've reached your limit of ${max} favourites. You can increase it in extension popup (up to 25) or remove an existing favourite.`}
      </p>
      <p class="text-token-text-secondary text-sm mb-2">
        Your favourites sync automatically between all devices where you're
        signed into Chrome. The space available for this is small, so we keep a
        cap to make sure everything stays in sync.
      </p>
      <p class="text-token-text-secondary text-sm">
        In a future update we'll add the option to switch to larger non-sync
        storage or unlimited cloud storage.
      </p>
    </div>
    <div class="flex w-full flex-row items-center text-sm select-none justify-end p-4 pt-0">
      <button type="button" class="btn relative btn-primary" onClick={onClose}>
        <div class="flex items-center justify-center">Got it</div>
      </button>
    </div>
  </>
);

export { UnfavouriteModalHost };
