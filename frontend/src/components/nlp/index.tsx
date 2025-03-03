/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { Grid, Paper, Tab, Tabs } from "@mui/material";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React from "react";

import { TabPanel } from "@/app-components/tabs/TabPanel";
import { useCreate } from "@/hooks/crud/useCreate";
import { useFind } from "@/hooks/crud/useFind";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, Format } from "@/services/types";
import {
  INlpDatasetSampleAttributes,
  INlpSample,
  INlpSampleFormAttributes,
  INlpSampleFull,
} from "@/types/nlp-sample.types";

import NlpDatasetCounter from "./components/NlpDatasetCounter";
import NlpSample from "./components/NlpSample";
import NlpDatasetSample from "./components/NlpTrainForm";
import { NlpValues } from "./components/NlpValue";

const NlpEntity = dynamic(() => import("./components/NlpEntity"));

export const Nlp = ({
  entityId,
  selectedTab,
}: {
  entityId?: string;
  selectedTab: "sample" | "entity";
}) => {
  useFind(
    {
      entity: EntityType.NLP_ENTITY,
      format: Format.FULL,
    },
    {
      hasCount: false,
    },
  );
  const router = useRouter();
  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    router.push(
      `/nlp/${newValue === "sample" ? "" : "nlp-entities"}`,
      undefined,
      {
        shallow: true,
        scroll: false,
      },
    );
  };
  const { t } = useTranslate();
  const { toast } = useToast();
  const { mutate: createSample } = useCreate<
    EntityType.NLP_SAMPLE,
    INlpDatasetSampleAttributes,
    INlpSample,
    INlpSampleFull
  >(EntityType.NLP_SAMPLE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: () => {
      toast.success(t("message.success_save"));
    },
  });
  const onSubmitForm = (params: INlpSampleFormAttributes) => {
    createSample({
      text: params.text,
      type: params.type,
      entities: [...params.traitEntities, ...params.keywordEntities],
      language: params.language,
    });
  };

  return (
    <Grid container gap={2} flexDirection="column">
      <PageHeader title={t("title.nlp_train")} icon={faGraduationCap} />
      <Grid item xs={12}>
        <Grid container flexDirection="row">
          <Grid item xs={7}>
            <Paper>
              <NlpDatasetSample submitForm={onSubmitForm} />
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
              <NlpSample />
            </TabPanel>

            {/* NLP ENTITIES */}
            <TabPanel value={selectedTab} index="entity">
              {entityId ? <NlpValues entityId={entityId} /> : <NlpEntity />}
            </TabPanel>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
