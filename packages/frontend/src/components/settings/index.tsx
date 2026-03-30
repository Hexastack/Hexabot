/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  FormControl,
  Paper,
  styled,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import debounce from "@mui/utils/debounce";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import { Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { JsonSchemaForm } from "@/app-components/inputs/JsonSchemaForm";
import { a11yProps, TabPanel } from "@/app-components/tabs/TabPanel";
import { useFind } from "@/hooks/crud/useFind";
import { useTanstackQuery } from "@/hooks/crud/useTanstack";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useApiClient } from "@/hooks/useApiClient";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, QueryType, RouterType } from "@/services/types";
import { ISetting, ISettingSchemasMap } from "@/types/setting.types";

import { extractUiSchema } from "../visual-editor/v4/utils/schema-defaults.utils";

const StyledForm = styled("form")();
const DEFAULT_SETTINGS_GROUP = "chatbot_settings" as const;
const toGroupedSettings = (settings: ISetting[]) => {
  return settings.reduce(
    (acc, curr) => {
      acc[curr.group] = acc[curr.group] ? acc[curr.group].concat(curr) : [curr];

      return acc;
    },
    {} as Record<string, ISetting[]>,
  );
};
const toGroupFormData = (settingsByGroup: Record<string, ISetting[]>) => {
  return Object.entries(settingsByGroup).reduce(
    (acc, [group, settings]) => {
      acc[group] = settings.reduce(
        (groupAcc, setting) => {
          groupAcc[setting.label] = setting.value;

          return groupAcc;
        },
        {} as Record<string, unknown>,
      );

      return acc;
    },
    {} as Record<string, Record<string, unknown>>,
  );
};
const toSettingsByGroupAndLabel = (settings: ISetting[]) => {
  return settings.reduce(
    (acc, setting) => {
      const byLabel = acc[setting.group] || {};

      byLabel[setting.label] = setting;
      acc[setting.group] = byLabel;

      return acc;
    },
    {} as Record<string, Record<string, ISetting>>,
  );
};
const areSettingValuesEqual = (left: unknown, right: unknown): boolean => {
  return JSON.stringify(left) === JSON.stringify(right);
};
const buildSettingsUiSchema = (schema: RJSFSchema): UiSchema => {
  const extracted = extractUiSchema(schema);
  const order = Object.keys(schema.properties || {});

  if (!order.length) {
    return extracted;
  }

  return {
    ...extracted,
    "ui:order": order,
  };
};

export const Settings = () => {
  const { t } = useTranslate();
  const router = useAppRouter();
  const rawGroup = router.query.group;
  const group = Array.isArray(rawGroup) ? rawGroup.at(-1) : rawGroup;
  const { toast } = useToast();
  const { apiClient } = useApiClient();
  const [selectedTab, setSelectedTab] = useState(
    group || DEFAULT_SETTINGS_GROUP,
  );
  const [formDataByGroup, setFormDataByGroup] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const { data: settings = [] } = useFind(
    { entity: EntityType.SETTING },
    {
      hasCount: false,
    },
  );
  const { data: schemas = {} } = useTanstackQuery<ISettingSchemasMap>({
    queryKey: [QueryType.item, EntityType.SETTING, "schemas"],
    queryFn: async () => {
      return await apiClient.getSettingSchemas();
    },
  });
  const { mutate: updateSetting } = useUpdate(EntityType.SETTING, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: () => {
      toast.success(t("message.success_save"));
    },
  });
  const groupedSettings = useMemo(
    () => toGroupedSettings(settings),
    [settings],
  );
  const settingsByGroupAndLabel = useMemo(
    () => toSettingsByGroupAndLabel(settings),
    [settings],
  );
  const groups = useMemo(() => {
    const schemaGroups = Object.keys(schemas || {});
    const extraGroups = Object.keys(groupedSettings).filter(
      (group) => !schemaGroups.includes(group),
    );

    return schemaGroups.concat(extraGroups);
  }, [groupedSettings, schemas]);

  useEffect(() => {
    const incomingGroup = group || DEFAULT_SETTINGS_GROUP;

    setSelectedTab(incomingGroup);
  }, [group]);

  useEffect(() => {
    if (groups.length === 0) {
      return;
    }

    if (!groups.includes(selectedTab)) {
      setSelectedTab(groups[0]);
    }
  }, [groups, selectedTab]);

  useEffect(() => {
    const nextFormDataByGroup = toGroupFormData(groupedSettings);

    setFormDataByGroup((prev) =>
      areSettingValuesEqual(prev, nextFormDataByGroup)
        ? prev
        : nextFormDataByGroup,
    );
  }, [groupedSettings]);

  const handleUpdate = useCallback(
    (settingId: string, value: unknown) => {
      updateSetting({ id: settingId, params: { value } });
    },
    [updateSetting],
  );
  const debouncedUpdate = useMemo(
    () =>
      debounce((settingId: string, value: unknown) => {
        handleUpdate(settingId, value);
      }, 400),
    [handleUpdate],
  );

  useEffect(() => {
    return () => {
      debouncedUpdate.clear();
    };
  }, [debouncedUpdate]);

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
    router.push(`/${RouterType.SETTINGS}/groups/${newValue}`);
  };
  const handleFormDataChange = (
    groupName: string,
    nextFormData: Record<string, unknown>,
  ) => {
    const settingsByLabel = settingsByGroupAndLabel[groupName] || {};

    Object.entries(nextFormData).forEach(([label, nextValue]) => {
      const setting = settingsByLabel[label];

      if (!setting) {
        return;
      }
      if (areSettingValuesEqual(setting.value, nextValue)) {
        return;
      }

      debouncedUpdate(setting.id, nextValue);
    });
  };

  return (
    <Grid container gap={3} flexDirection="column">
      <PageHeader icon={SettingsIcon} title={t("title.settings")} />
      <Grid size={12}>
        <Paper variant="spaced">
          <Grid sx={{ display: "flex", maxWidth: "md" }}>
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={selectedTab}
              onChange={handleChange}
            >
              {groups.map((group, index) => (
                <Tab
                  value={group}
                  key={group}
                  label={t(`title.${group}`, {
                    ns: group,
                    defaultValue: group,
                  })}
                  {...a11yProps(index)}
                />
              ))}
            </Tabs>
            <StyledForm sx={{ width: "100%", px: 3, paddingY: 2 }}>
              {groups.map((groupName) => {
                const definition = schemas[groupName];
                const schema = definition?.schema as RJSFSchema | undefined;

                return (
                  <TabPanel
                    sx={{ gap: 2 }}
                    value={selectedTab}
                    index={groupName}
                    key={groupName}
                  >
                    {!schema ? (
                      <Typography variant="body2" color="text.secondary">
                        {t("message.no_settings_schema", {
                          defaultValue:
                            "No settings schema is available for this group.",
                        })}
                      </Typography>
                    ) : (
                      <FormControl>
                        <JsonSchemaForm
                          schema={schema}
                          formData={formDataByGroup[groupName] || {}}
                          onFormDataChange={(data) =>
                            handleFormDataChange(groupName, data)
                          }
                          uiSchema={buildSettingsUiSchema(schema)}
                          enableJsonataTextWidget={false}
                          idPrefix={`settings-${groupName}`}
                        />
                      </FormControl>
                    )}
                  </TabPanel>
                );
              })}
            </StyledForm>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
