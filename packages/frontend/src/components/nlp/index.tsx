/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { Grid, Paper, Tab, Tabs } from "@mui/material";
import React, { useMemo } from "react";

import { TabPanel } from "@/app-components/tabs/TabPanel";
import { useFind } from "@/hooks/crud/useFind";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, Format } from "@/services/types";

import NlpDatasetCounter from "./components/NlpDatasetCounter";
import NlpSample from "./components/NlpSample";
import { NlpSampleForm } from "./components/NlpSampleForm";
import { NlpValues } from "./components/NlpValue";

const NlpEntity = React.lazy(() => import("./components/NlpEntity"));

export const Nlp = () => {
  useFind(
    {
      entity: EntityType.NLP_ENTITY,
      format: Format.FULL,
    },
    {
      hasCount: false,
    },
  );
  const router = useAppRouter();
  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    router.push(newValue === "sample" ? "/nlp" : "/nlp/nlp-entities");
  };
  const { t } = useTranslate();
  const entityId = useMemo(() => {
    return Array.isArray(router.query.id)
      ? router.query.id.at(-1)
      : router.query.id;
  }, [router.query]);
  const selectedTab = useMemo(() => {
    return router.pathname === "/nlp" ? "sample" : "entity";
  }, [router.pathname]);

  return (
    <Grid container gap={2} flexDirection="column">
      <PageHeader title={t("title.nlp_train")} icon={faGraduationCap} />
      <Grid item xs={12}>
        <Grid container flexDirection="row">
          <Grid item xs={7}>
            <Paper sx={{ px: 3, py: 2 }}>
              <NlpSampleForm data={{ defaultValues: null }} />
            </Paper>
          </Grid>
          <Grid item xs={5} pl={2}>
            <Paper>
              <NlpDatasetCounter />
            </Paper>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ pb: "20px" }}>
          <Tabs
            orientation="horizontal"
            variant="scrollable"
            value={selectedTab}
            onChange={handleChange}
          >
            <Tab label={t("title.nlp")} value="sample" />
            <Tab label={t("title.nlp_entities")} value="entity" />
          </Tabs>

          {/* NLP SAMPLES */}
          <Grid sx={{ padding: "20px" }}>
            <TabPanel value={selectedTab} index="sample">
              {selectedTab === "sample" ? <NlpSample /> : null}
            </TabPanel>

            {/* NLP ENTITIES */}
            <TabPanel value={selectedTab} index="entity">
              {selectedTab === "entity" ? (
                entityId ? (
                  <NlpValues entityId={entityId} />
                ) : (
                  <NlpEntity />
                )
              ) : null}
            </TabPanel>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
