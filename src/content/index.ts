import "./content.css";
import { h } from "preact";
import { mountInline } from "../common/content/inline/mount";
import { UnfavouriteModalHost } from "./floating/components/UnfavouriteModalHost";
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

  const unpinContainer = document.createElement("div");
  document.body.appendChild(unpinContainer);
  mountInline(unpinContainer, h(UnpinModalHost, null));

  const unfavContainer = document.createElement("div");
  document.body.appendChild(unfavContainer);
  mountInline(unfavContainer, h(UnfavouriteModalHost, null));
}
