type MessageMap = Record<string, { request: unknown; response: unknown }>;

const createContentMessaging = <
  BM extends MessageMap,
  CM extends MessageMap,
>() => {
  const sendMessage = <K extends keyof BM>(
    type: K,
    payload: BM[K]["request"],
  ): Promise<BM[K]["response"]> =>
    chrome.runtime.sendMessage({ type, payload }) as Promise<BM[K]["response"]>;

  const onContentMessage = <K extends keyof CM>(
    type: K,
    handler: (
      payload: CM[K]["request"],
      sender: chrome.runtime.MessageSender,
    ) => Promise<CM[K]["response"]> | CM[K]["response"],
  ): (() => void) => {
    const listener = (
      message: { type: string; payload: unknown },
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: unknown) => void,
    ) => {
      if (message.type !== type) return false;
      const result = handler(message.payload as CM[K]["request"], sender);
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

  return { sendMessage, onContentMessage };
};

export { createContentMessaging };
