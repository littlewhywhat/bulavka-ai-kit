import { h } from "preact";
import { mountInline } from "../../common/content/inline/mount";

const container = document.createElement("div");
container.style.cssText =
  "position:fixed;pointer-events:none;display:none;z-index:30000";
document.body.appendChild(container);

let showTimeout: ReturnType<typeof setTimeout> | null = null;

const Tooltip = ({ title, subs }: { title: string; subs: string[] }) =>
  h(
    "div",
    {
      class:
        "relative z-50 select-none px-2 py-1 rounded-lg overflow-hidden dark bg-black max-w-xs",
    },
    h(
      "div",
      {
        class:
          "text-token-text-primary text-xs font-semibold whitespace-pre-wrap text-center",
      },
      title,
    ),
    ...subs.map((sub) =>
      h(
        "div",
        {
          class:
            "text-token-text-tertiary text-xs font-medium whitespace-pre-wrap text-center",
        },
        sub,
      ),
    ),
  );

const show = (target: Element, titleText: string, subs?: string[]): void => {
  if (showTimeout) clearTimeout(showTimeout);
  showTimeout = setTimeout(() => {
    mountInline(container, h(Tooltip, { title: titleText, subs: subs ?? [] }));
    container.style.display = "block";
    const r = target.getBoundingClientRect();
    container.style.top = `${r.bottom + 6}px`;
    container.style.left = `${r.left + r.width / 2 - container.offsetWidth / 2}px`;
  }, 100);
};

const hide = (): void => {
  if (showTimeout) clearTimeout(showTimeout);
  container.style.display = "none";
};

export { show, hide };
