/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React from "react";

import "./ErrorScreen.scss";
import ErrorIcon from "./icons/Error";
import Template from "./ScreenTemplate";

const ErrorScreen: React.FC = () => {
  return <Template name="error" Icon={ErrorIcon} />;
};

export default ErrorScreen;
