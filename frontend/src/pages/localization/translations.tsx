/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ReactElement } from "react";

import { Translations } from "@/components/translations";
import { Layout } from "@/layout";

const TranslationsPage = () => {
  return <Translations />;
};

TranslationsPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default TranslationsPage;
