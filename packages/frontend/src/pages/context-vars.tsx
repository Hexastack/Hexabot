/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ReactElement } from "react";

import { ContextVars } from "@/components/context-vars";
import { Layout } from "@/layout";

const ContextVarPage = () => {
  return <ContextVars />;
};

ContextVarPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default ContextVarPage;
