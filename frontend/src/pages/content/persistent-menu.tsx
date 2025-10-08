/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ReactElement } from "react";

import { Menu } from "@/components/menu/index";
import { Layout } from "@/layout/index";

const MenusPage = () => {
  return <Menu />;
};

MenusPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default MenusPage;
