/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Suspense } from "react";

import { Progress } from "@/app-components/displays/Progress";
import { Layout } from "@/layout";

import { useAppRouter } from "./hooks/useAppRouter";

const App = () => {
  const { element, routeObject } = useAppRouter();
  const { handle } = routeObject;

  return (
    <Suspense fallback={<Progress />}>
      <Layout {...handle}>
        <>{element}</>
      </Layout>
    </Suspense>
  );
};

export default App;
