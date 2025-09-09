/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ComponentType } from "react";

import AttachmentIcon from "@/app-components/svg/toolbar/AttachmentIcon";
import ButtonsIcon from "@/app-components/svg/toolbar/ButtonsIcon";
import ListIcon from "@/app-components/svg/toolbar/ListIcon";
import PluginIcon from "@/app-components/svg/toolbar/PluginIcon";
import QuickRepliesIcon from "@/app-components/svg/toolbar/QuickRepliesIcon";
import SimpleTextIcon from "@/app-components/svg/toolbar/SimpleTextIcon";
import {
  BlockMessage,
  BlockType,
  IBlockSearchResult,
} from "@/types/block.types";

/**
 * Determines the type of a block message by inspecting its structure and properties.
 *
 * @param message - The block message to determine the type of.
 * @returns The determined `BlockType` for the given message.
 */
export const getBlockType = (message: BlockMessage): BlockType => {
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
 * Extracts text content from a block message.
 *
 * @param message - The block message to extract text from.
 * @returns The extracted text content as an array of strings.
 */
export const getBlockTextContent = (
  message: IBlockSearchResult["message"],
): string[] => {
  if (typeof message === "string") return [message];
  if (Array.isArray(message)) return message;

  if (typeof message === "object" && message) {
    // Handle standard message types with text property
    if ("text" in message) {
      const text = String(message.text ?? "");

      return text ? [text] : [];
    }

    // Handle plugin messages with args containing text content
    if (
      "plugin" in message &&
      "args" in message &&
      message.args &&
      typeof message.args === "object"
    ) {
      const pluginTextFields: string[] = [];

      // Extract text content from args object
      Object.values(message.args).forEach((value) => {
        if (typeof value === "string" && value) {
          pluginTextFields.push(value);
        } else if (Array.isArray(value)) {
          // Handle arrays of strings
          value.forEach((item) => {
            if (typeof item === "string" && item) {
              pluginTextFields.push(item);
            }
          });
        }
      });

      return pluginTextFields;
    }
  }

  return [];
};

/**
 * Extracts fallback text content from block options.
 *
 * @param options - The block options to extract fallback text from.
 * @returns The extracted fallback text content as an array of strings.
 */
export const getFallbackTextContent = (
  options: IBlockSearchResult["options"],
): string[] => {
  if (Array.isArray(options?.fallback?.message)) {
    return options.fallback.message;
  }

  return [];
};

/**
 * Creates a block excerpt combining main text message and fallback message content.
 *
 * @param message - The block message.
 * @param options - The block options.
 * @returns An string containing the block excerpt.
 */
export const getBlockExcerpt = (
  message: IBlockSearchResult["message"],
  options: IBlockSearchResult["options"],
): string => {
  const excerpt: string[] = [];
  const blockTextContent = getBlockTextContent(message);
  const fallbackTextContent = getFallbackTextContent(options);

  if (blockTextContent.length > 0) {
    const formattedBlockContent = blockTextContent
      .map((item) => `\n - ${item}`)
      .join("");

    excerpt.push(`• Block Messages:${formattedBlockContent}`);
  }
  if (fallbackTextContent.length > 0) {
    const formattedFallbackContent = fallbackTextContent
      .map((item) => `\n - ${item}`)
      .join("");

    excerpt.push(`• Fallback Messages:${formattedFallbackContent}`);
  }

  const formattedExcerpt = excerpt.join("\n\n");

  return formattedExcerpt;
};

/**
 * Returns the corresponding icon component for a given block type.
 *
 * @param type - The type of block for which to retrieve the icon.
 * @returns The React component representing the icon for the specified block type.
 *          If the type is not found in the icon map, the PluginIcon is returned as a default.
 */
export const getBlockIconByType = (type: BlockType) => {
  const iconMap: Record<BlockType, ComponentType<any>> = {
    [BlockType.TEXT]: SimpleTextIcon,
    [BlockType.ATTACHMENT]: AttachmentIcon,
    [BlockType.QUICK_REPLIES]: QuickRepliesIcon,
    [BlockType.BUTTONS]: ButtonsIcon,
    [BlockType.LIST]: ListIcon,
    [BlockType.PLUGIN]: PluginIcon,
  };

  return iconMap[type] || PluginIcon;
};