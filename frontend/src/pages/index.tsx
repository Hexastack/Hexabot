/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ReactElement } from "react";
import "eazychart-css";

import { Dashboard } from "@/components/dashboard";

import { Layout } from "../layout";

const DashboardPage = () => {
  return <Dashboard />;
};

DashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default DashboardPage;
