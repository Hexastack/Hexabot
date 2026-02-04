/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Suspense } from "react";
import { useRoutes } from "react-router-dom";

import { Progress } from "@/app-components/displays/Progress";
import { Layout } from "@/layout";

import { routes } from "./routes";

const App = () => {
  const element = useRoutes(routes);
  const { match } = element?.props;
  const { handle } = match.route;

  return (
    <Suspense fallback={<Progress />}>
      <Layout {...handle}>
        <>{element}</>
      </Layout>
    </Suspense>
  );
};

export default App;
