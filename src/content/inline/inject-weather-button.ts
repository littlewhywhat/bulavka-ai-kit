import { h } from "preact";
import { mountInline } from "../../common/content/inline/mount";
import { observe } from "../../common/content/inline/observe";
import { toggleOverlay } from "../floating/overlay";
import { WeatherButton } from "./components/WeatherButton";

const MARKER_ATTR = "data-ext-weather";
const SELECTOR = 'form[role="search"]';

const injectWeatherButtons = (): void => {
  observe({
    selector: SELECTOR,
    markerAttr: MARKER_ATTR,
    onElement: (form) => {
      const wrapper = form.closest("div");
      if (!wrapper) return undefined;
      const container = document.createElement("div");
      container.style.cssText =
        "display:flex;justify-content:center;padding:8px 0;";
      wrapper.parentElement?.insertBefore(container, wrapper.nextSibling);
      const { dispose } = mountInline(
        container,
        h(WeatherButton, { onClick: toggleOverlay }),
      );
      return () => {
        dispose();
        container.remove();
      };
    },
  });
};

export { injectWeatherButtons };
