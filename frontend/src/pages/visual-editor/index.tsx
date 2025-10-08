/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ReactElement } from "react";

import { VisualEditor } from "@/components/visual-editor/v3";
import { Layout } from "@/layout";

const VisualEditorPage = () => {
  return <VisualEditor />;
};

VisualEditorPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout hasNoPadding>{page}</Layout>;
};

export default VisualEditorPage;
