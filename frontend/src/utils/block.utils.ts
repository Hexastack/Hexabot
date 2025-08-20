/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AttachmentIcon from "@/app-components/svg/toolbar/AttachmentIcon";
import ButtonsIcon from "@/app-components/svg/toolbar/ButtonsIcon";
import ListIcon from "@/app-components/svg/toolbar/ListIcon";
import PluginIcon from "@/app-components/svg/toolbar/PluginIcon";
import QuickRepliesIcon from "@/app-components/svg/toolbar/QuickRepliesIcon";
import SimpleTextIcon from "@/app-components/svg/toolbar/SimpleTextIcon";
import { BlockMessage, BlockType } from "@/types/block.types";

/**
 * Determines the type of a block message by inspecting its structure and properties.
 *
 * @param message - The block message to determine the type of.
 * @returns The determined `BlockType` for the given message.
 */
export const determineType = (message: BlockMessage): BlockType => {
  if (typeof message === "string" || Array.isArray(message))
    return BlockType.TEXT;
  if (message && typeof message === "object") {
    if ("attachment" in message) return BlockType.ATTACHMENT;
    if ("quickReplies" in message) return BlockType.QUICK_REPLIES;
    if ("buttons" in message) return BlockType.BUTTONS;
    if ("elements" in message) return BlockType.LIST;
  }

  return BlockType.PLUGIN;
};

/**
 * Returns the corresponding icon component for a given block type.
 *
 * @param type - The type of block for which to retrieve the icon.
 * @returns The React component representing the icon for the specified block type.
 *          If the type is not found in the icon map, the PluginIcon is returned as a default.
 */
export const getIconForType = (type: BlockType) => {
  const iconMap: Record<BlockType, React.ComponentType<any>> = {
    [BlockType.TEXT]: SimpleTextIcon,
    [BlockType.ATTACHMENT]: AttachmentIcon,
    [BlockType.QUICK_REPLIES]: QuickRepliesIcon,
    [BlockType.BUTTONS]: ButtonsIcon,
    [BlockType.LIST]: ListIcon,
    [BlockType.PLUGIN]: PluginIcon,
  };

  return iconMap[type] || PluginIcon;
};
