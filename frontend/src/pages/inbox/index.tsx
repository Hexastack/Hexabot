/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ReactElement } from "react";

import { Inbox } from "@/components/inbox";
import { Layout } from "@/layout";

const InboxPage = () => {
  return <Inbox />;
};

InboxPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout hasNoPadding>{page}</Layout>;
};

export default InboxPage;
