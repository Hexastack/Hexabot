/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useRouter } from "next/router";
import { ReactElement } from "react";

import { Nlp } from "@/components/nlp";
import { Layout } from "@/layout";

const NlpPage = () => {
  const router = useRouter();

  return (
    <Nlp
      entityId={router.query.id as string}
      selectedTab={router.pathname === "/nlp" ? "sample" : "entity"}
    />
  );
};

NlpPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default NlpPage;
