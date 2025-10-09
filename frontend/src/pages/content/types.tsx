/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ReactElement } from "react";

import { ContentTypes } from "@/components/content-types";
import { Layout } from "@/layout";

const ContentTypesPage = () => {
  return <ContentTypes />;
};

ContentTypesPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default ContentTypesPage;
