/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Nlp } from "@/components/nlp";
import { useAppRouter } from "@/hooks/useAppRouter";

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

export default NlpPage;
