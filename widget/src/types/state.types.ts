/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

export enum OutgoingMessageState {
  sent = 0,
  sending = 1,
  uploading = 2,
}

export enum ConnectionState {
  disconnected = 0,
  wantToConnect = 1,
  tryingToConnect = 2,
  connected = 3,
}

export type ChatScreen =
  // Screen that shows up before the chat (user subscription)
  | "prechat"
  // Screen that shows up after the chat is closed (not in use yet)
  | "postchat"
  // Screen shows up when user clicks on a url button where there is a webview
  | "webview"
  // Screen that shows the messages and text input
  | "chat";
