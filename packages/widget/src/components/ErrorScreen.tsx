/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AlertTriangle } from "lucide-react";
import React from "react";

import Template from "./ScreenTemplate";

const ErrorScreen: React.FC = () => {
  return <Template name="error" Icon={AlertTriangle} />;
};

export default ErrorScreen;
