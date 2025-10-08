/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ReactElement } from "react";

import { ResetPassword } from "@/app-components/auth/ResetPassword";
import { Layout } from "@/layout";

const ResetPage = () => {
  return <ResetPassword />;
};

ResetPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout sxContent={{ alignContent: "center" }}>{page}</Layout>;
};

export default ResetPage;
