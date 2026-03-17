/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Button, Paper, Tab, Tabs, Typography, styled } from "@mui/material";
import Grid from "@mui/material/Grid";
import type { RJSFSchema } from "@rjsf/utils";
import { Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Progress } from "@/app-components/displays/Progress";
import { JsonSchemaForm } from "@/app-components/inputs/JsonSchemaForm";
import { a11yProps, TabPanel } from "@/app-components/tabs/TabPanel";
import { useTanstackMutation, useTanstackQuery, useTanstackQueryClient } from "@/hooks/crud/useTanstack";
import { useApiClient } from "@/hooks/useApiClient";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, QueryType, RouterType } from "@/services/types";
import { ISettingCatalogGroup } from "@/types/setting.types";
import { isRecord } from "@/utils/object";

import { buildSettingsUiSchema } from "../visual-editor/v4/utils/settings-ui-schema.utils";

const StyledPanel = styled("div")({
  width: "100%",
  padding: "16px 24px",
});
const DEFAULT_SETTINGS_GROUP = "chatbot_settings" as const;
const SETTINGS_CATALOG_QUERY_KEY = ["settings-catalog"] as const;
const hasSchemaProperties = (schema: RJSFSchema) => {
  return isRecord(schema.properties) && Object.keys(schema.properties).length > 0;
};
const localizeSettingsSchema = (
  schema: RJSFSchema,
  group: string,
  t: ReturnType<typeof useTranslate>["t"],
): RJSFSchema => {
  if (!isRecord(schema.properties)) {
    return schema;
  }

  const properties = Object.fromEntries(
    Object.entries(schema.properties).map(([propertyName, propertySchema]) => {
      if (!isRecord(propertySchema)) {
        return [propertyName, propertySchema];
      }

      const fallbackTitle =
        typeof propertySchema.title === "string"
          ? propertySchema.title
          : propertyName;
      const fallbackDescription =
        typeof propertySchema.description === "string"
          ? propertySchema.description
          : "";
      const translatedDescription = t(`help.${propertyName}`, {
        ns: group,
        defaultValue: fallbackDescription,
      });

      return [
        propertyName,
        {
          ...propertySchema,
          title: t(`label.${propertyName}`, {
            ns: group,
            defaultValue: fallbackTitle,
          }),
          ...(translatedDescription
            ? { description: translatedDescription }
            : {}),
        },
      ];
    }),
  );

  return {
    ...schema,
    properties,
  };
};
const replaceCatalogGroup = (
  current: ISettingCatalogGroup[] | undefined,
  next: ISettingCatalogGroup,
) => {
  if (!current) {
    return [next];
  }

  const hasExisting = current.some((group) => group.group === next.group);
  const nextCatalog = hasExisting
    ? current.map((group) => (group.group === next.group ? next : group))
    : [...current, next];

  return nextCatalog.sort((left, right) => left.group.localeCompare(right.group));
};

export const Settings = () => {
  const { t } = useTranslate();
  const { apiClient } = useApiClient();
  const queryClient = useTanstackQueryClient();
  const router = useAppRouter();
  const rawGroup = router.query.group;
  const routeGroup = Array.isArray(rawGroup) ? rawGroup.at(-1) : rawGroup;
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState(
    routeGroup || DEFAULT_SETTINGS_GROUP,
  );
  const [formDataByGroup, setFormDataByGroup] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [visibleErrorsByGroup, setVisibleErrorsByGroup] = useState<
    Record<string, boolean>
  >({});
  const { data: catalog = [], isLoading } = useTanstackQuery({
    queryKey: SETTINGS_CATALOG_QUERY_KEY,
    queryFn: () => apiClient.getSettingsCatalog<ISettingCatalogGroup[]>(),
  });
  const groups = useMemo(() => {
    return catalog
      .map((group) => ({
        ...group,
        schema: localizeSettingsSchema(group.schema, group.group, t),
      }))
      .filter((group) => hasSchemaProperties(group.schema))
      .sort((left, right) => left.group.localeCompare(right.group));
  }, [catalog, t]);
  const { mutate: saveSettingsGroup, isPending: isSaving } = useTanstackMutation(
    {
      mutationFn: ({
        group,
        values,
      }: {
        group: string;
        values: Record<string, unknown>;
      }) => apiClient.updateSettingGroup<ISettingCatalogGroup>(group, values),
      onError: () => {
        toast.error(t("message.internal_server_error"));
      },
      onSuccess: (updatedGroup) => {
        toast.success(t("message.success_save"));
        setFormDataByGroup((current) => ({
          ...current,
          [updatedGroup.group]: updatedGroup.values,
        }));
        queryClient.setQueryData<ISettingCatalogGroup[]>(
          SETTINGS_CATALOG_QUERY_KEY,
          (current) => replaceCatalogGroup(current, updatedGroup),
        );
        queryClient.invalidateQueries({
          queryKey: [QueryType.collection, EntityType.SETTING],
        });
      },
    },
  );

  useEffect(() => {
    setFormDataByGroup(
      Object.fromEntries(
        catalog.map((group) => [group.group, group.values ?? {}]),
      ),
    );
    setVisibleErrorsByGroup({});
  }, [catalog]);

  useEffect(() => {
    const fallbackGroup = groups[0]?.group ?? DEFAULT_SETTINGS_GROUP;
    const nextSelectedGroup =
      routeGroup && groups.some((group) => group.group === routeGroup)
        ? routeGroup
        : fallbackGroup;

    setSelectedTab(nextSelectedGroup);
  }, [groups, routeGroup]);

  const handleGroupFormDataChange = useCallback(
    (group: string, nextFormData: Record<string, unknown>) => {
      setFormDataByGroup((current) =>
        current[group] === nextFormData
          ? current
          : {
              ...current,
              [group]: nextFormData,
            },
      );
    },
    [],
  );
  const handleGroupVisibleErrorsChange = useCallback(
    (group: string, hasVisibleErrors: boolean) => {
      setVisibleErrorsByGroup((current) =>
        current[group] === hasVisibleErrors
          ? current
          : {
              ...current,
              [group]: hasVisibleErrors,
            },
      );
    },
    [],
  );
  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
    router.push(`/${RouterType.SETTINGS}/groups/${newValue}`);
  };

  return (
    <Grid container gap={3} flexDirection="column">
      <PageHeader icon={SettingsIcon} title={t("title.settings")} />
      <Grid size={12}>
        <Paper variant="spaced">
          {isLoading ? (
            <Progress />
          ) : groups.length === 0 ? (
            <Grid sx={{ padding: 3 }}>
              <Typography>{t("label.no_data")}</Typography>
            </Grid>
          ) : (
            <Grid sx={{ display: "flex", maxWidth: "md" }}>
              <Tabs
                orientation="vertical"
                variant="scrollable"
                value={selectedTab}
                onChange={handleChange}
              >
                {groups.map((group, index) => (
                  <Tab
                    value={group.group}
                    key={group.group}
                    label={t(`title.${group.group}`, {
                      ns: group.group,
                      defaultValue: group.group,
                    })}
                    {...a11yProps(index)}
                  />
                ))}
              </Tabs>
              <StyledPanel>
                {groups.map((group) => {
                  const formData =
                    formDataByGroup[group.group] ?? group.values ?? {};

                  return (
                    <TabPanel
                      sx={{ gap: 2 }}
                      value={selectedTab}
                      index={group.group}
                      key={group.group}
                    >
                      <JsonSchemaForm
                        schema={group.schema}
                        formData={formData}
                        onFormDataChange={(nextFormData) =>
                          handleGroupFormDataChange(group.group, nextFormData)
                        }
                        onVisibleErrorsChange={(hasVisibleErrors) =>
                          handleGroupVisibleErrorsChange(
                            group.group,
                            hasVisibleErrors,
                          )
                        }
                        validateOnMount
                        uiSchema={buildSettingsUiSchema(group.schema, formData)}
                        enableJsonataTextWidget={false}
                        idPrefix={`settings-${group.group}`}
                      />
                      <Grid sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          variant="contained"
                          onClick={() =>
                            saveSettingsGroup({
                              group: group.group,
                              values: formData,
                            })
                          }
                          disabled={
                            isSaving || Boolean(visibleErrorsByGroup[group.group])
                          }
                        >
                          {t("button.save")}
                        </Button>
                      </Grid>
                    </TabPanel>
                  );
                })}
              </StyledPanel>
            </Grid>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};
