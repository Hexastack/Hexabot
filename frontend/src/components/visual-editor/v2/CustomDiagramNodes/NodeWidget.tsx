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
import FastForwardRoundedIcon from "@mui/icons-material/FastForwardRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ReplyIcon from "@mui/icons-material/Reply";
import { Chip, styled } from "@mui/material";
import { DiagramEngine, PortWidget } from "@projectstorm/react-diagrams-core";
import clsx from "clsx";
import * as React from "react";
import { FC } from "react";
import { withTranslation, WithTranslation } from "react-i18next";

import { UnifiedIcon } from "@/app-components/icons/UnifiedIcon";
import AttachmentIcon from "@/app-components/svg/toolbar/AttachmentIcon";
import ButtonsIcon from "@/app-components/svg/toolbar/ButtonsIcon";
import ListIcon from "@/app-components/svg/toolbar/ListIcon";
import PluginIcon from "@/app-components/svg/toolbar/PluginIcon";
import QuickRepliesIcon from "@/app-components/svg/toolbar/QuickRepliesIcon";
import SimpleTextIcon from "@/app-components/svg/toolbar/SimpleTextIcon";
import TriggerIcon from "@/app-components/svg/TriggerIcon";
import { IBlockFull, Pattern } from "@/types/block.types";
import { BlockPorts, BlockTypes, TBlock } from "@/types/visual-editor.types";
import { truncate } from "@/utils/text";

import { NodeModel } from "./NodeModel";

export const BLOCK_WIDTH = 360;
export const BLOCK_HEIGHT = 200;

export interface NodeWidgetProps {
  node: NodeModel;
  engine: DiagramEngine;
  color: string;
}

const IconContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: theme.palette.background.paper,
  borderRadius: "100%",
  padding: "1px",
}));

export interface NodeWidgetState {}

class NodeAbstractWidget extends React.Component<
  NodeWidgetProps & WithTranslation,
  NodeWidgetState
> {
  constructor(props: NodeWidgetProps & WithTranslation) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className={clsx("custom-node-port")}>
        {!this.props.node.source ? (
          <PortWidget
            engine={this.props.engine}
            //TODO: need to be updated
            // @ts-ignore
            port={this.props.node.getPort(BlockPorts.inPort)}
            className={clsx("circle-porter", "circle-porter-in")}
          >
            <IconContainer
              style={{
                borderWidth: "1px",
                borderColor: this.props.color,
                borderStyle: "solid",
              }}
            >
              <PlayArrowRoundedIcon
                sx={{
                  color: this.props.color,
                  fontSize: 23,
                }}
              />
            </IconContainer>
          </PortWidget>
        ) : null}
        {this.props.node.content}
        <div className="circle-out-porters">
          {Object.entries(this.props.node.getPorts())
            //TODO: need to be updated
            // @ts-ignore
            .filter(([, value]) => !value.options.in)
            .map(([, value], index) => (
              <PortWidget
                //TODO: need to be updated
                // @ts-ignore
                key={value.options.id}
                engine={this.props.engine}
                //TODO: need to be updated
                // @ts-ignore
                port={this.props.node.getPort(value.options.name)}
                className={clsx(
                  "circle-porter",
                  "circle-porter-out",
                  //TODO: need to be updated
                  // @ts-ignore
                  this.props.node.getPort(value.options.name)?.isLocked()
                    ? "circle-porter-out-off"
                    : "",
                )}
              >
                <IconContainer
                  style={{
                    borderWidth: "1px",
                    borderColor: this.props.color,
                    borderStyle: "solid",
                  }}
                >
                  {index === 0 ? (
                    <PlayArrowRoundedIcon
                      sx={{
                        color: this.props.color,
                        fontSize: 23,
                      }}
                    />
                  ) : (
                    <FastForwardRoundedIcon
                      sx={{
                        color: this.props.color,
                        fontSize: 23,
                      }}
                    />
                  )}
                </IconContainer>
              </PortWidget>
            ))}
        </div>
      </div>
    );
  }
}

class NodeFunctionWidget extends React.Component<
  NodeWidgetProps & WithTranslation,
  NodeWidgetState
> {
  constructor(props: NodeWidgetProps & WithTranslation) {
    super(props);
    this.state = {};
  }

  render() {
    const { t } = this.props;

    return (
      <>
        {this.props.node.inputs.length > 0 ? (
          <div className="custom-node-subheader">{t("label.inputs")}</div>
        ) : null}
        {this.props.node.inputs.map((input, index) => (
          <div
            key={"i-" + index}
            className={clsx("custom-node-port", "custom-node-port-in")}
          >
            <PortWidget
              engine={this.props.engine}
              //TODO: need to be updated
              // @ts-ignore
              port={this.props.node.getPort(input)}
              className={clsx("circle-porter", "circle-porter-in")}
            >
              <div className={clsx("circle-port")} />
            </PortWidget>
            {input}
          </div>
        ))}

        {this.props.node.outputs.length > 0 ? (
          <div className="custom-node-subheader">Outputs</div>
        ) : null}
        {this.props.node.outputs.map((output, index) => (
          <div
            key={"o-" + index}
            className={clsx("custom-node-port", "custom-node-port-out")}
          >
            {output}
            <PortWidget
              engine={this.props.engine}
              //TODO: need to be updated
              // @ts-ignore
              port={this.props.node.getPort(output)}
              className={clsx("circle-porter", "circle-porter-out")}
            >
              <div className={clsx("circle-port")} />
            </PortWidget>
          </div>
        ))}
      </>
    );
  }
}

function determineCase(blockMessage: IBlockFull["message"]) {
  if (typeof blockMessage === "string" || Array.isArray(blockMessage))
    return "text";
  if ("attachment" in blockMessage) return "attachment";
  if ("quickReplies" in blockMessage) return "quickReplies";
  if ("buttons" in blockMessage) return "buttons";
  if ("elements" in blockMessage) return "list";

  return "plugin";
}

const getBlockConfig = (
  blockMessage: IBlockFull["message"],
): { type: TBlock; color: string; Icon: FC<React.SVGProps<SVGSVGElement>> } => {
  switch (determineCase(blockMessage)) {
    case "text":
      return { type: "text", color: "#009185", Icon: SimpleTextIcon };
    case "attachment":
      return { type: "attachment", color: "#e6a23c", Icon: AttachmentIcon };
    case "quickReplies":
      return { type: "quickReplies", color: "#a80551", Icon: QuickRepliesIcon };
    case "buttons":
      return { type: "buttons", color: "#570063", Icon: ButtonsIcon };
    case "list":
      return { type: "list", color: "#108aa8", Icon: ListIcon };
    case "plugin":
      return { type: "plugin", color: "#a8ba33", Icon: PluginIcon };
    default:
      throw new Error("Unexpected case");
  }
};

class NodeWidget extends React.Component<
  NodeWidgetProps & WithTranslation,
  NodeWidgetState
> {
  config: {
    type: TBlock;
    color: string;
    Icon: FC<React.SVGProps<SVGSVGElement>>;
  };
  constructor(props: NodeWidgetProps & WithTranslation) {
    super(props);
    this.state = {};
    this.config = getBlockConfig(this.props.node.message as any);
  }

  render() {
    const { t, i18n, tReady } = this.props;

    return (
      <div
        className={clsx(
          "custom-node",
          this.props.node.isSelected() ? "selected" : "",
        )}
        style={{
          border: `1px solid ${this.config.color}`,
        }}
      >
        {this.props.node.starts_conversation ? (
          <div className="start-point-container">
            <PlayArrowRoundedIcon className="start-point" />
          </div>
        ) : null}
        <div
          className="node-title"
          style={{
            backgroundColor: this.config.color,
          }}
        >
          <div
            style={{
              display: "flex",
              backgroundColor: "white",
              borderRadius: "100%",
              padding: "2px",
            }}
          >
            <this.config.Icon width={32} height={32} />
          </div>
          {this.props.node.title}
        </div>
        <div className="node-block-field-container">
          <div className="node-block-field">
            <TriggerIcon color={this.config.color} />

            {this.props.node.patterns.length > 0 ? (
              this.props.node.patterns
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
          {[BlockTypes.attachment].includes(BlockTypes[this.config.type]) ? (
            <div className="node-block-field">
              <UnifiedIcon
                Icon={BrokenImageOutlinedIcon}
                color={this.config.color}
                size="21px"
              />
              {t("label.attachment")}:{" "}
              {(this.props.node.message as any).attachment.type}
            </div>
          ) : null}
          {[BlockTypes.plugin].includes(BlockTypes[this.config.type]) ? (
            <div className="node-block-field ">
              <UnifiedIcon
                Icon={ExtensionOutlinedIcon}
                color={this.config.color}
                size="21px"
              />
              <span>Plugin: {(this.props.node.message as any).plugin}</span>
            </div>
          ) : null}
          {[BlockTypes.list].includes(BlockTypes[this.config.type]) ? (
            <div className="node-block-field ">
              <UnifiedIcon
                Icon={ChatBubbleOutlineOutlinedIcon}
                color={this.config.color}
                size="21px"
              />
              {t("label.list")}
            </div>
          ) : null}
          {[BlockTypes.text].includes(BlockTypes[this.config.type]) &&
          this.props.node.message.length ? (
            <div className="node-block-field ">
              <UnifiedIcon
                Icon={ChatBubbleOutlineOutlinedIcon}
                color={this.config.color}
                size="21px"
              />
              {truncate(this.props.node.message[0])}
            </div>
          ) : null}
          {[BlockTypes.quickReplies, BlockTypes.buttons].includes(
            BlockTypes[this.config.type],
          ) ? (
            <div className="node-block-field ">
              <UnifiedIcon
                Icon={ChatBubbleOutlineOutlinedIcon}
                color={this.config.color}
                size="21px"
              />
              {
                //TODO: need to be updated
                // @ts-ignore
                truncate(this.props.node.message.text)
              }
            </div>
          ) : null}
          {[BlockTypes.quickReplies, BlockTypes.buttons].includes(
            BlockTypes[this.config.type],
          ) ? (
            <div className="node-block-field">
              <UnifiedIcon
                Icon={
                  this.config.type === "quickReplies"
                    ? ReplyIcon
                    : MenuRoundedIcon
                }
                color={this.config.color}
                size="21px"
              />
              <div className="node-block-chips">
                {
                  //TODO: need to be updated
                  // @ts-ignore
                  (
                    (this.props.node.message as any).buttons ||
                    (this.props.node.message as any).quickReplies
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
          ) : null}{" "}
        </div>
        {this.props.node.content ? (
          <NodeAbstractWidget
            node={this.props.node}
            engine={this.props.engine}
            color={this.config.color}
            t={t}
            i18n={i18n}
            tReady={tReady}
          />
        ) : (
          <NodeFunctionWidget
            node={this.props.node}
            engine={this.props.engine}
            color={this.config.color}
            t={t}
            i18n={i18n}
            tReady={tReady}
          />
        )}
      </div>
    );
  }
}

export default withTranslation()(NodeWidget);
