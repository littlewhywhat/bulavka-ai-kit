/** @jsxImportSource preact */
import { useEffect, useRef, useState } from "preact/hooks";
import { useSettingsValue } from "../../sidebar/useSettingsValue";
import { addPin, onPinsChange, type Pin, requestUnpin } from "../../storage";
import { getConversationIdFromUrl } from "../../utils/chatgpt";
import * as tooltip from "../tooltip";

type PinButtonProps = {
  available: boolean;
};

const resolveMessageId = (btn: HTMLElement): string | undefined => {
  const article = btn.closest("article");
  if (!article) return undefined;
  const nearest = btn.closest("div[data-message-id]");
  if (nearest && article.contains(nearest))
    return nearest.getAttribute("data-message-id") ?? undefined;
  const any = article.querySelector("div[data-message-id]");
  return any?.getAttribute("data-message-id") ?? undefined;
};

const extractPreview = (btn: HTMLElement): string => {
  const article = btn.closest("article");
  if (!article) return "";
  const msgEl = article.querySelector("div[data-message-id]");
  const text = (msgEl ?? article).textContent ?? "";
  return text
    .trim()
    .replace(/^ChatGPT\s*(said)?:?\s*/i, "")
    .slice(0, 60);
};

const PinButton = ({ available }: PinButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [pinned, setPinned] = useState(false);
  const [pinCount, setPinCount] = useState(0);

  useEffect(() => {
    const update = (pins: Pin[]) => {
      setPinCount(pins.length);
      if (!available) return;
      const el = ref.current;
      if (!el) return;
      const conversationId = getConversationIdFromUrl();
      const messageId = resolveMessageId(el);
      if (conversationId && messageId) {
        setPinned(
          pins.some(
            (p) =>
              p.conversationId === conversationId && p.messageId === messageId,
          ),
        );
      }
    };
    return onPinsChange(update);
  }, [available]);

  const maxPins = useSettingsValue("maxPins", 5);
  const atLimit = available && !pinned && pinCount >= maxPins;

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (!available || atLimit) return;
    const el = ref.current;
    if (!el) return;
    const conversationId = getConversationIdFromUrl();
    const messageId = resolveMessageId(el);
    if (!conversationId || !messageId) return;

    if (pinned) {
      requestUnpin({
        conversationId,
        messageId,
        preview: extractPreview(el),
        pinnedAt: 0,
      });
    } else {
      addPin({
        conversationId,
        messageId,
        preview: extractPreview(el),
        pinnedAt: Date.now(),
      });
    }
  };

  const UNAVAILABLE_MSG = "Not available\nin branches or when logged out";
  const LIMIT_MSG = "Not available";
  const LIMIT_SUB = "Upgrade to able to pin more";
  const tooltipTitle = !available
    ? UNAVAILABLE_MSG
    : atLimit
      ? LIMIT_MSG
      : pinned
        ? "Unpin message"
        : "Pin message";

  const disabled = !available || atLimit;

  return (
    <button
      ref={ref}
      type="button"
      class="text-token-text-secondary hover:bg-token-bg-secondary rounded-lg"
      aria-label={tooltipTitle.replace("\n", " ")}
      style={disabled ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
      onMouseEnter={() => {
        if (ref.current)
          tooltip.show(
            ref.current,
            !available ? "Not available" : atLimit ? LIMIT_MSG : tooltipTitle,
            !available
              ? ["in branches or when logged out"]
              : atLimit
                ? [LIMIT_SUB]
                : undefined,
          );
      }}
      onMouseLeave={() => tooltip.hide()}
      onClick={handleClick}
      disabled={disabled}
    >
      <span class="flex items-center justify-center touch:w-10 h-8 w-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          aria-hidden="true"
          class="icon"
        >
          <use
            href={
              pinned
                ? "/cdn/assets/sprites-core-fk4oovux.svg#13322a"
                : "/cdn/assets/sprites-core-fk4oovux.svg#23d2ff"
            }
            fill="currentColor"
          />
        </svg>
      </span>
    </button>
  );
};

export { PinButton };
