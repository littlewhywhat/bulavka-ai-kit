import { h } from "preact";
import { mountFloating } from "../../common/content/floating/mount";
import { setupDrag } from "../../common/content/floating/setup-drag";
import { sendMessage } from "../messaging";
import { WeatherOverlay } from "./components/WeatherOverlay";
import floatingStyles from "./floating.css?inline";

let floatingDispose: (() => void) | null = null;

const HOST_STYLES = "position:fixed;z-index:2147483647;top:16px;right:16px;";

const toggleOverlay = (): void => {
  if (floatingDispose) {
    floatingDispose();
    floatingDispose = null;
    return;
  }

  sendMessage("get-weather", { city: "San Francisco" }).then((res) => {
    if (!res.ok) return;
    const close = () => {
      floatingDispose?.();
      floatingDispose = null;
    };
    const { host, shadow, dispose } = mountFloating(
      h(WeatherOverlay, { data: res.data, onClose: close }),
      HOST_STYLES,
      floatingStyles,
    );
    const disposeDrag = setupDrag(host, shadow);
    floatingDispose = () => {
      disposeDrag();
      dispose();
    };
  });
};

export { toggleOverlay };
