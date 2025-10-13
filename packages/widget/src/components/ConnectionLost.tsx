/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React from "react";

import "./ConnectionLost.scss";
import ConnectionIcon from "./icons/ConnectionIcon";
import Template from "./ScreenTemplate";

const ConnectionLost: React.FC = () => {
  return <Template name="disconnected" Icon={ConnectionIcon} />;
};

export default ConnectionLost;
