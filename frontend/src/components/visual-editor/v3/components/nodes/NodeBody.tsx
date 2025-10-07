/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import BrokenImageOutlinedIcon from "@mui/icons-material/BrokenImageOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import ExtensionOutlinedIcon from "@mui/icons-material/ExtensionOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ReplyIcon from "@mui/icons-material/Reply";
import { Chip } from "@mui/material";

import { UnifiedIcon } from "@/app-components/icons/UnifiedIcon";
import TriggerIcon from "@/app-components/svg/TriggerIcon";
import { useGet } from "@/hooks/crud/useGet";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { Pattern } from "@/types/block.types";
import { truncate } from "@/utils/text";

import { BlockTypes } from "../../types/visual-editor.types";
import { getBlockConfig } from "../../utils/block.utils";

export const NodeBody = ({ blockId }: { blockId: string }) => {
  const { t } = useTranslate();
  const { data: block } = useGet(blockId, { entity: EntityType.BLOCK });

  if (!block?.message) {
    return null;
  }

  const config = getBlockConfig(block.message);

  return (
    <div className="node-block-field-container">
      <div className="node-block-field">
        <TriggerIcon color={config.color} style={{ flexShrink: 0 }} />
        {block?.patterns?.length ? (
          block?.patterns
            .map((pattern: Pattern) => {
              if (typeof pattern === "string") {
                return pattern;
              } else if (typeof pattern === "object") {
                if (pattern && "label" in pattern) {
                  return pattern.label;
                } else if (Array.isArray(pattern)) {
                  return pattern
                    .map((p) => {
                      return `${p.entity}=${"value" in p ? p.value : "*"}`;
                    })
                    .join(" & ");
                }
              }
            })
            .map((p, idx) => (
              <Chip
                variant="inbox"
                size="medium"
                key={`${p}_${idx}`}
                label={p}
              />
            ))
        ) : (
          <span style={{ color: "#939393" }}>{t("label.no_patterns")}</span>
        )}
      </div>
      {config.type === "attachment" && "attachment" in block.message ? (
        <div className="node-block-field">
          <UnifiedIcon
            Icon={BrokenImageOutlinedIcon}
            color={config.color}
            size="21px"
          />
          {t("label.attachment")}: {block.message.attachment.type}
        </div>
      ) : null}
      {config.type === "plugin" && "plugin" in block.message ? (
        <div className="node-block-field ">
          <UnifiedIcon
            Icon={ExtensionOutlinedIcon}
            color={config.color}
            size="21px"
          />
          <span>Plugin: {block.message.plugin}</span>
        </div>
      ) : null}
      {[BlockTypes.list].includes(BlockTypes[config.type]) ? (
        <div className="node-block-field ">
          <UnifiedIcon
            Icon={ChatBubbleOutlineOutlinedIcon}
            color={config.color}
            size="21px"
          />
          {t("label.list")}
        </div>
      ) : null}
      {config.type === "text" &&
      Array.isArray(block.message) &&
      block.message.length > 0 ? (
        <div className="node-block-field ">
          <UnifiedIcon
            Icon={ChatBubbleOutlineOutlinedIcon}
            color={config.color}
            size="21px"
          />
          {truncate(block?.message[0])}
        </div>
      ) : null}
      {[BlockTypes.quickReplies, BlockTypes.buttons].includes(
        BlockTypes[config.type],
      ) ? (
        <div className="node-block-field ">
          <UnifiedIcon
            Icon={ChatBubbleOutlineOutlinedIcon}
            color={config.color}
            size="21px"
          />
          {
            //TODO: need to be updated
            // @ts-ignore
            truncate(block?.message.text)
          }
        </div>
      ) : null}
      {[BlockTypes.quickReplies, BlockTypes.buttons].includes(
        BlockTypes[config.type],
      ) ? (
        <div className="node-block-field">
          <UnifiedIcon
            Icon={config.type === "quickReplies" ? ReplyIcon : MenuRoundedIcon}
            color={config.color}
            size="21px"
          />
          <div className="node-block-chips">
            {
              //TODO: need to be updated
              // @ts-ignore
              (
                (block?.message as any).buttons ||
                (block?.message as any).quickReplies
              ).map((button, idx: number) => (
                <Chip
                  key={`${button.title}_${idx}`}
                  variant="inbox"
                  size="medium"
                  label={button.title}
                />
              ))
            }
          </div>
        </div>
      ) : null}
    </div>
  );
};
