import "./content.css";
import { h } from "preact";
import { mountInline } from "../common/content/inline/mount";
import { UnpinModalHost } from "./floating/components/UnpinModalHost";
import { initFavouriteMenuItem } from "./inline/inject-favourite-menu-item";
import { initPinButtons } from "./inline/inject-pin-button";
import { injectPinnedChatsSection } from "./sidebar/inject-pinned-chats-section";
import { injectPinsSection } from "./sidebar/inject-pins-section";

if (location.hostname.includes("chatgpt")) {
  initPinButtons();
  initFavouriteMenuItem();
  injectPinnedChatsSection();
  injectPinsSection();

  const modalContainer = document.createElement("div");
  document.body.appendChild(modalContainer);
  mountInline(modalContainer, h(UnpinModalHost, null));
}
