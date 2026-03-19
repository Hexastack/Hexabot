/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Paper, styled, Tab, Tabs, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import debounce from "@mui/utils/debounce";
import type { RJSFSchema } from "@rjsf/utils";
import { Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Progress } from "@/app-components/displays/Progress";
import { JsonSchemaForm } from "@/app-components/inputs/JsonSchemaForm";
import { a11yProps, TabPanel } from "@/app-components/tabs/TabPanel";
import { useFind } from "@/hooks/crud/useFind";
import { useTanstackMutation } from "@/hooks/crud/useTanstack";
import { useApiClient } from "@/hooks/useApiClient";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, RouterType } from "@/services/types";
import { ISetting } from "@/types/setting.types";
import { isRecord } from "@/utils/object";

import { buildSettingsUiSchema } from "../visual-editor/v4/utils/settings-ui-schema.utils";

const StyledPanel = styled("div")({
  width: "100%",
  padding: "16px 24px",
});
const DEFAULT_SETTINGS_GROUP = "chatbot_settings" as const;

type SettingFormGroup = {
  group: string;
  schema: RJSFSchema;
  values: Record<string, unknown>;
};
const hasSchemaProperties = (schema: RJSFSchema) => {
  return (
    isRecord(schema.properties) && Object.keys(schema.properties).length > 0
  );
};
const sortSettings = <T extends Pick<ISetting, "group" | "label" | "weight">>(
  settings: readonly T[],
) => {
  return [...settings].sort((left, right) => {
    const groupComparison = left.group.localeCompare(right.group);

    if (groupComparison !== 0) {
      return groupComparison;
    }

    const leftWeight = left.weight ?? Number.MAX_SAFE_INTEGER;
    const rightWeight = right.weight ?? Number.MAX_SAFE_INTEGER;

    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight;
    }

    return left.label.localeCompare(right.label);
  });
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
const buildSettingsGroupSchema = (
  settings: readonly ISetting[],
): RJSFSchema => {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: Object.fromEntries(
      sortSettings(settings).map((setting) => {
        const propertySchema = isRecord(setting.schema) ? setting.schema : {};
        const title =
          typeof propertySchema.title === "string" &&
          propertySchema.title.length > 0
            ? propertySchema.title
            : setting.label;

        return [
          setting.label,
          {
            ...propertySchema,
            title,
          },
        ];
      }),
    ),
    additionalProperties: false,
  };
};
const buildSettingsGroupValues = (settings: readonly ISetting[]) => {
  return Object.fromEntries(
    sortSettings(settings).map((setting) => [
      setting.label,
      isRecord(setting.schema) ? setting.schema.default : undefined,
    ]),
  );
};
const buildSettingFormGroups = (
  settings: readonly ISetting[],
): SettingFormGroup[] => {
  const settingsByGroup = sortSettings(settings).reduce(
    (acc, setting) => {
      const groupSettings = acc[setting.group] ?? [];

      groupSettings.push(setting);
      acc[setting.group] = groupSettings;

      return acc;
    },
    {} as Record<string, ISetting[]>,
  );

  return Object.entries(settingsByGroup)
    .map(([group, groupSettings]) => ({
      group,
      schema: buildSettingsGroupSchema(groupSettings),
      values: buildSettingsGroupValues(groupSettings),
    }))
    .filter((group) => hasSchemaProperties(group.schema))
    .sort((left, right) => left.group.localeCompare(right.group));
};

export const Settings = () => {
  const { t } = useTranslate();
  const { apiClient } = useApiClient();
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
  const [pendingSave, setPendingSave] = useState<{
    group: string;
    values: Record<string, unknown>;
  } | null>(null);
  const { data: settings = [], isLoading } = useFind({
    entity: EntityType.SETTING,
  });
  const groups = useMemo(() => {
    return buildSettingFormGroups(settings);
    // eslint-disable-next-line react-hooks/use-memo
  }, [JSON.stringify(settings)]);
  const localizedGroups = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        schema: localizeSettingsSchema(group.schema, group.group, t),
      })),
    [groups, t],
  );
  const { mutate: saveSettingsGroup, isPending: isSaving } =
    useTanstackMutation({
      mutationFn: ({
        group,
        values,
      }: {
        group: string;
        values: Record<string, unknown>;
      }) => apiClient.updateSettingGroup<ISetting[]>(group, values),
      onError: () => {
        toast.error(t("message.internal_server_error"));
      },
      onSuccess: (updatedSettings) => {
        const updatedGroup = updatedSettings[0]?.group;

        toast.success(t("message.success_save"));

        if (updatedGroup) {
          setFormDataByGroup((current) => ({
            ...current,
            [updatedGroup]: buildSettingsGroupValues(updatedSettings),
          }));
        }
      },
    });
  const debouncedSaveSettingsGroup = useMemo(
    () =>
      debounce((next: { group: string; values: Record<string, unknown> }) => {
        saveSettingsGroup(next);
      }, 300),
    [saveSettingsGroup],
  );

  useEffect(() => {
    if (groups.length === 0) return;

    const nextFormData = Object.fromEntries(
      groups.map((group) => [group.group, group.values]),
    );

    setFormDataByGroup((current) => {
      const isSame =
        Object.keys(nextFormData).length === Object.keys(current).length &&
        Object.keys(nextFormData).every(
          (key) => current[key] === nextFormData[key],
        );

      return isSame ? current : nextFormData;
    });

    setVisibleErrorsByGroup((current) => {
      if (Object.keys(current).length === 0) return current;

      return {};
    });
    setPendingSave(null);
  }, [groups]);

  useEffect(() => {
    if (!pendingSave) return;
    if (isSaving || visibleErrorsByGroup[pendingSave.group]) {
      return;
    }

    const syncedValues = groups.find(
      (group) => group.group === pendingSave.group,
    )?.values;

    if (syncedValues === pendingSave.values) {
      setPendingSave(null);

      return;
    }

    debouncedSaveSettingsGroup(pendingSave);
    setPendingSave(null);
  }, [
    pendingSave,
    isSaving,
    visibleErrorsByGroup,
    groups,
    debouncedSaveSettingsGroup,
  ]);

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
      if (formDataByGroup[group] === nextFormData) {
        return;
      }

      setFormDataByGroup((current) => ({
        ...current,
        [group]: nextFormData,
      }));
      setPendingSave({ group, values: nextFormData });
    },
    [formDataByGroup],
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
          ) : localizedGroups.length === 0 ? (
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
                {localizedGroups.map((group, index) => (
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
                {localizedGroups.map((group) => {
                  const formData = formDataByGroup[group.group] ?? group.values;

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
