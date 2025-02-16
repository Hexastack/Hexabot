/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
