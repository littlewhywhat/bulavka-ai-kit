# Privacy Policy — Bulavka AI Kit

Last updated: March 14, 2026

Bulavka AI Kit ("the Extension") is a browser extension that adds favouriting and pinning functionality to ChatGPT. This policy describes what data the Extension collects and how it is used.

## 1. Open Source

The Extension is open source. You can review the full source code at **https://github.com/littlewhywhat/bulavka-ai-kit**.

## 2. Data Stored Locally

Your favourite chats and pinned replies are stored in Chrome's built-in sync storage (`chrome.storage.sync`). This data never leaves your browser except through Chrome's own sync mechanism if you have Chrome sync enabled. The Extension does not read, store, or transmit the content of your conversations.

## 3. Anonymous Usage Analytics

The Extension collects anonymous analytics to understand how the product is used and to improve it. This includes:

- A randomly generated anonymous identifier (UUID) — not linked to your identity
- Extension version, install date, and update history
- Browser name and version, platform, and language
- Feature usage events: pin/unpin reply, favourite/unfavourite chat, toggle section visibility
- Periodic heartbeat pings to measure active usage

Analytics data is sent to our server over HTTPS. You can verify exactly what is sent by reading the source code at https://github.com/littlewhywhat/bulavka-ai-kit.

## 4. What We Do Not Collect

- No personal information (name, email, account details)
- No conversation content, prompts, or AI responses
- No browsing history beyond the ChatGPT pages the Extension operates on
- No cookies or cross-site tracking
- No data from any website other than chatgpt.com

## 5. Third-Party Sharing

We do not sell, rent, or share any collected data with third parties. Analytics data is used solely for product improvement.

## 6. Permissions Used

- `storage` — to save your favourites, pins, and settings
- `alarms` — to schedule periodic anonymous usage pings

## 7. Data Deletion

Uninstalling the Extension removes all locally stored data (favourites, pins, settings).

To request deletion of your anonymous analytics data, email **sidegptapp@gmail.com** with your anonymous ID. You can find it by running the following snippet in the Chrome DevTools console on any ChatGPT tab while the Extension is installed:

```js
chrome.storage.local.get("bulavka-ai-kit-analytics", (r) => console.log(r["bulavka-ai-kit-analytics"]?.uuid));
```

Include the printed UUID in your email and we will delete all associated records.

## 8. Changes to This Policy

We may update this policy from time to time. Changes will be posted at this URL with an updated date.

## 9. Contact

For questions or data deletion requests: **sidegptapp@gmail.com**
