/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  ButtonType,
  FileType,
  IncomingMessageType,
  Message,
  OutgoingMessageType,
  StdOutgoingListMessageData,
} from "@hexabot-ai/types";
import { createTheme } from "@mui/material/styles";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("dompurify", () => ({
  default: {
    sanitize: (value: string) => value,
  },
}));

vi.mock("marked", () => ({
  marked: {
    parse: (value: string) => value,
  },
}));

vi.mock("../components/AttachmentViewer", () => ({
  MessageAttachmentsViewer: () => <span>ATTACHMENTS</span>,
}));

vi.mock("../components/Carousel", () => ({
  Carousel: () => <span>CAROUSEL</span>,
}));

vi.mock("../components/GeolocationMessage", () => ({
  default: () => <span>GEOLOCATION</span>,
}));

import { getMessageContent } from "./mapMessages";

const theme = createTheme();
const date = new Date("2026-01-01T00:00:00.000Z");

function buildMessageEntity(
  message: Message["message"],
  outgoing = false,
): Message {
  return {
    id: "msg-1",
    mid: "mid-1",
    createdAt: date,
    updatedAt: date,
    message,
    thread: "thread-1",
    sender: outgoing ? null : "subscriber-1",
    recipient: outgoing ? "subscriber-1" : null,
    sentBy: outgoing ? "user-1" : null,
    read: false,
    delivery: false,
    handover: false,
  };
}

function renderMessage(message: Message["message"], outgoing = false) {
  const entity = buildMessageEntity(message, outgoing);

  return renderToStaticMarkup(
    <>{getMessageContent(entity, theme, "12:00", "Jan 1, 2026 12:00")}</>,
  );
}

describe("getMessageContent", () => {
  it("renders all outgoing discriminator variants", () => {
    expect(
      renderMessage(
        {
          type: OutgoingMessageType.text,
          data: { text: "Outgoing text" },
        },
        true,
      ),
    ).toContain("Outgoing text");

    const quickRepliesHtml = renderMessage(
      {
        type: OutgoingMessageType.quickReply,
        data: {
          text: "Quick reply prompt",
          quickReplies: [{ title: "Yes", payload: "yes" }],
        },
      },
      true,
    );

    expect(quickRepliesHtml).toContain("Quick reply prompt");
    expect(quickRepliesHtml).toContain("Yes");

    const buttonsHtml = renderMessage(
      {
        type: OutgoingMessageType.buttons,
        data: {
          text: "Buttons prompt",
          buttons: [
            {
              type: ButtonType.postback,
              title: "About",
              payload: "about",
            },
          ],
        },
      },
      true,
    );

    expect(buttonsHtml).toContain("Buttons prompt");
    expect(buttonsHtml).toContain("About");

    expect(
      renderMessage(
        {
          type: OutgoingMessageType.attachment,
          data: {
            attachment: {
              type: FileType.image,
              payload: { url: "https://example.com/image.jpg" },
            },
          },
        },
        true,
      ),
    ).toContain("ATTACHMENTS");

    const listMessageData: StdOutgoingListMessageData = {
      options: {
        display: "list",
        fields: { title: "title" },
        buttons: [],
        limit: 3,
      },
      elements: [{ id: "item-1", title: "Item 1" }],
      pagination: { total: 1, skip: 0, limit: 1 },
    };
    const carouselMessageData: StdOutgoingListMessageData = {
      ...listMessageData,
      options: {
        ...listMessageData.options,
        display: "carousel",
      },
    };

    expect(
      renderMessage(
        {
          type: OutgoingMessageType.list,
          data: listMessageData,
        },
        true,
      ),
    ).toContain("CAROUSEL");

    expect(
      renderMessage(
        {
          type: OutgoingMessageType.carousel,
          data: carouselMessageData,
        },
        true,
      ),
    ).toContain("CAROUSEL");
  });

  it("renders all incoming discriminator variants", () => {
    expect(
      renderMessage({
        type: IncomingMessageType.text,
        data: { text: "Incoming text" },
      }),
    ).toContain("Incoming text");

    expect(
      renderMessage({
        type: IncomingMessageType.postback,
        data: { text: "Postback text", payload: "about" },
      }),
    ).toContain("Postback text");

    expect(
      renderMessage({
        type: IncomingMessageType.quickReply,
        data: { text: "Quick reply text", payload: "yes" },
      }),
    ).toContain("Quick reply text");

    expect(
      renderMessage({
        type: IncomingMessageType.location,
        data: { coordinates: { lat: 36.8, lon: 10.2 } },
      }),
    ).toContain("GEOLOCATION");

    expect(
      renderMessage({
        type: IncomingMessageType.attachment,
        data: {
          serializedText: "file.jpg",
          attachment: {
            type: FileType.file,
            payload: { url: "https://example.com/file.pdf" },
          },
        },
      }),
    ).toContain("ATTACHMENTS");
  });

  it("does not use legacy quick_replies aliases", () => {
    const html = renderMessage(
      {
        type: OutgoingMessageType.quickReply,
        data: {
          text: "Only canonical quick replies",
          quickReplies: [],
        },
        quick_replies: [{ title: "Legacy option", payload: "legacy" }],
      } as Message["message"],
      true,
    );

    expect(html).toContain("Only canonical quick replies");
    expect(html).not.toContain("Legacy option");
  });
});
