/** @jsxImportSource preact */
import { useEffect, useRef, useState } from "preact/hooks";
import { chatgptConfig } from "../../chatgpt-config";
import { useSettingsValue } from "../../sidebar/useSettingsValue";
import { addPin, onPinsChange, type Pin, requestUnpin } from "../../storage";
import { getConversationIdFromUrl } from "../../utils/chatgpt";
import * as tooltip from "../tooltip";

type PinButtonProps = {
  available: boolean;
};

const resolveMessageId = (btn: HTMLElement): string | undefined => {
  const section = btn.closest(chatgptConfig.selectors.assistantSection);
  if (!section) return undefined;
  const nearest = btn.closest(chatgptConfig.selectors.messageElement);
  if (nearest && section.contains(nearest))
    return (
      nearest.getAttribute(chatgptConfig.attributes.messageId) ?? undefined
    );
  const any = section.querySelector(chatgptConfig.selectors.messageElement);
  return any?.getAttribute(chatgptConfig.attributes.messageId) ?? undefined;
};

const extractPreview = (btn: HTMLElement): string => {
  const section = btn.closest(chatgptConfig.selectors.assistantSection);
  if (!section) return "";
  const msgEl = section.querySelector(chatgptConfig.selectors.messageElement);
  const text = (msgEl ?? section).textContent ?? "";
  return text
    .trim()
    .replace(/^ChatGPT\s*(said)?:?\s*/i, "")
    .slice(0, 40);
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
                ? chatgptConfig.sprites.pinFilled
                : chatgptConfig.sprites.pinOutline
            }
            fill="currentColor"
          />
        </svg>
      </span>
    </button>
  );
};

export { PinButton };
