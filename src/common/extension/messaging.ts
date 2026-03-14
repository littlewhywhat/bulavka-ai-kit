type MessageMap = Record<string, { request: unknown; response: unknown }>;

const createExtensionMessaging = <
  BM extends MessageMap,
  CM extends MessageMap,
>() => {
  const sendMessage = <K extends keyof BM>(
    type: K,
    payload: BM[K]["request"],
  ): Promise<BM[K]["response"]> =>
    chrome.runtime.sendMessage({ type, payload }) as Promise<BM[K]["response"]>;

  const onBackgroundMessage = <K extends keyof BM>(
    type: K,
    handler: (
      payload: BM[K]["request"],
      sender: chrome.runtime.MessageSender,
    ) => Promise<BM[K]["response"]> | BM[K]["response"],
  ): (() => void) => {
    const listener = (
      message: { type: string; payload: unknown },
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: unknown) => void,
    ) => {
      if (message.type !== type) return false;
      const result = handler(message.payload as BM[K]["request"], sender);
      if (result instanceof Promise) {
        result.then(sendResponse);
        return true;
      }
      sendResponse(result);
      return false;
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  };

  const sendToTab = <K extends keyof CM>(
    tabId: number,
    type: K,
    payload: CM[K]["request"],
  ): Promise<CM[K]["response"]> =>
    chrome.tabs.sendMessage(tabId, { type, payload }) as Promise<
      CM[K]["response"]
    >;

  return { sendMessage, onBackgroundMessage, sendToTab };
};

export { createExtensionMessaging };
