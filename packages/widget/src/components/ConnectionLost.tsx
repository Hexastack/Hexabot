/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WifiOff } from "lucide-react";
import React from "react";

import Template from "./ScreenTemplate";

const ConnectionLost: React.FC = () => {
  return <Template name="disconnected" Icon={WifiOff} />;
};

export default ConnectionLost;
