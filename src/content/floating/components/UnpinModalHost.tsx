/** @jsxImportSource preact */
import { useEffect, useState } from "preact/hooks";
import { onContentMessage } from "../../messaging";
import type { Pin } from "../../storage";
import { removePin } from "../../storage";

const UnpinModalHost = () => {
  const [pin, setPin] = useState<Pin | null>(null);

  useEffect(
    () =>
      onContentMessage("show-unpin-modal", (p) => {
        setPin(p);
        return undefined;
      }),
    [],
  );

  if (!pin) return null;

  const handleConfirm = () => {
    removePin(pin.conversationId, pin.messageId);
    setPin(null);
  };

  return (
    <div
      class="fixed inset-0 z-[9999]"
      style={{ pointerEvents: "auto" }}
      data-testid="modal-unpin-confirmation"
    >
      <button
        type="button"
        data-state="open"
        class="fixed inset-0 z-50 w-full h-full border-none cursor-default before:starting:backdrop-blur-0 before:absolute before:inset-0 before:bg-gray-200/50 before:backdrop-blur-[1px] not-motion-reduce:before:transition not-motion-reduce:before:duration-250 dark:before:bg-black/50 before:starting:opacity-0"
        style={{ pointerEvents: "auto" }}
        onClick={() => setPin(null)}
      />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ pointerEvents: "none" }}
      >
        <div
          role="dialog"
          class="popover bg-token-bg-primary rounded-2xl shadow-long flex flex-col max-w-md w-full overflow-hidden pointer-events-auto"
          tabIndex={-1}
          onClick={(e: MouseEvent) => e.stopPropagation()}
          onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
        >
          <header class="min-h-header-height flex justify-between p-2.5 ps-4 select-none">
            <h2 class="text-token-text-primary text-lg font-normal">
              Unpin message?
            </h2>
          </header>
          <div class="grow overflow-y-auto p-4 pt-1 min-w-0">
            <div class="flex gap-1 min-w-0">
              <span class="shrink-0">This will remove</span>
              <strong
                class="truncate min-w-0"
                title={pin.preview || "Pinned message"}
              >
                {pin.preview || "Pinned message"}
              </strong>
              <span class="shrink-0">from pinned replies.</span>
            </div>
          </div>
          <div class="flex w-full flex-row items-center text-sm select-none justify-end p-4 pt-0">
            <div class="flex flex-col gap-3 sm:flex-row-reverse flex w-full flex-row-reverse">
              <button
                type="button"
                class="btn relative btn-danger"
                data-testid="unpin-confirm-button"
                onClick={handleConfirm}
              >
                <div class="flex items-center justify-center">Unpin</div>
              </button>
              <button
                type="button"
                class="btn relative btn-secondary"
                onClick={() => setPin(null)}
              >
                <div class="flex items-center justify-center">Cancel</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { UnpinModalHost };
