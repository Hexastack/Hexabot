/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ContentContainer } from "@/app-components/dialogs";

import AttachmentMessageForm from "./AttachmentMessageForm";
import { useBlock } from "./BlockFormProvider";
import ButtonsMessageForm from "./ButtonsMessageForm";
import ListMessageForm from "./ListMessageForm";
import PluginMessageForm from "./PluginMessageForm";
import QuickRepliesMessageForm from "./QuickRepliesMessageForm";
import TextMessageForm from "./TextMessageForm";

export const MessageForm = () => {
  const block = useBlock();

  return (
    <ContentContainer>
      {/* TEXT BLOCK */}
      {Array.isArray(block?.message) ? <TextMessageForm /> : null}

      {/* ATTACHMENT BLOCK */}
      {block?.message && "attachment" in block?.message ? (
        <AttachmentMessageForm />
      ) : null}

      {/* QUICK REPLIES BLOCK */}
      {block?.message && "quickReplies" in block?.message ? (
        <QuickRepliesMessageForm />
      ) : null}

      {/* BUTTONS BLOCK */}
      {block?.message && "buttons" in block?.message ? (
        <ButtonsMessageForm />
      ) : null}

      {/* LIST BLOCK */}
      {block?.message &&
      "elements" in block.message &&
      block.options &&
      "content" in block.options ? (
        <ListMessageForm />
      ) : null}

      {/* PLUGIN BLOCK */}
      {block?.message && "plugin" in block?.message ? (
        <PluginMessageForm />
      ) : null}
    </ContentContainer>
  );
};

MessageForm.displayName = "MessageForm";
