/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ReactElement } from "react";

import { Register } from "@/app-components/auth/Register";
import { Layout } from "@/layout/index";

const RegisterPage = () => {
  return <Register />;
};

RegisterPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout sxContent={{ alignContent: "center" }}>{page}</Layout>;
};

export default RegisterPage;
