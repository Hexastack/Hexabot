/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ReactElement } from "react";

import { Login } from "@/app-components/auth/Login";
import { Layout } from "@/layout";

const LoginPage = () => {
  return <Login />;
};

LoginPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout sxContent={{ alignContent: "center" }}>{page}</Layout>;
};

export default LoginPage;
