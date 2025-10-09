/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ReactElement } from "react";

import { Labels } from "@/components/labels";
import { Layout } from "@/layout";

const LabelsPage = () => {
  return <Labels />;
};

LabelsPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default LabelsPage;
