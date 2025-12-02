Built-in Hexabot actions live here. Add new `.action.ts` files to expose them through the dynamic action registry.

Available actions:
- `send_text_message` — sends a text envelope and suspends the workflow until the subscriber replies.
- `send_quick_replies` — sends text with quick replies and waits for the chosen reply.
- `send_buttons` — sends text with buttons and waits for the follow-up message.
- `send_attachment` — sends an attachment (with optional quick replies) and waits for the reply.
