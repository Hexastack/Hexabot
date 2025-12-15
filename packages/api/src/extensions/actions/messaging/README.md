Built-in Hexabot actions live here. Add new `.action.ts` files to expose them through the dynamic action registry.

Available actions:
- `send_text_message` — sends a text envelope and (by default) suspends the workflow until the subscriber replies.
- `send_quick_replies` — sends text with quick replies and waits for the chosen reply unless suspension is disabled.
- `send_buttons` — sends text with buttons and waits for the follow-up message unless suspension is disabled.
- `send_attachment` — sends an attachment (with optional quick replies) and waits for the reply unless suspension is disabled.

Common settings:
- `typing` (boolean | number) — optionally emit a typing indicator before sending the message. Provide a number to override the auto-calculated duration.
- `await_reply` (boolean, default `true`) — when `false`, send the message and continue the workflow without suspending for a user response.
