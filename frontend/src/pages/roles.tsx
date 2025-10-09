/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ReactElement } from "react";

import { Roles } from "@/components/roles";

import { Layout } from "../layout";

const RolesPage = () => {
  return <Roles />;
};

RolesPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default RolesPage;
