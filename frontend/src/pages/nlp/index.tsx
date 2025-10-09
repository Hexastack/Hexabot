/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ReactElement } from "react";

import { Nlp } from "@/components/nlp";
import { useAppRouter } from "@/hooks/useAppRouter";
import { Layout } from "@/layout";

const NlpPage = () => {
  const router = useAppRouter();
  const entityId = Array.isArray(router.query.id)
    ? router.query.id.at(-1)
    : router.query.id;

  return (
    <Nlp
      entityId={entityId as string}
      selectedTab={router.pathname === "/nlp" ? "sample" : "entity"}
    />
  );
};

NlpPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default NlpPage;
