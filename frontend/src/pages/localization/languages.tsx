/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ReactElement } from "react";

import { Languages } from "@/components/languages";
import { Layout } from "@/layout";

const LanguagesPage = () => {
  return <Languages />;
};

LanguagesPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default LanguagesPage;
