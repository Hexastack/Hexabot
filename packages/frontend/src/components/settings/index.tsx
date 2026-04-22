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
import type { RJSFSchema } from "@rjsf/utils";
import { Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { JsonSchemaForm } from "@/app-components/inputs/JsonSchemaForm";
import { a11yProps, TabPanel } from "@/app-components/tabs/TabPanel";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useApiClientQuery } from "@/hooks/useApiClient";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, RouterType } from "@/services/types";
import { ISetting } from "@/types/setting.types";

import LicenseActivatedModal from "../license/LicenseActivatedModal";

import {
  buildSettingsUiSchema,
  resolveSettingsGroupTitle,
} from "./settings.utils";

const StyledFormContainer = styled("div")();
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

export const Settings = () => {
  const { t } = useTranslate();
  const { refetchUser } = useAuth();
  const router = useAppRouter();
  const rawGroup = router.query.group;
  const routeGroup = Array.isArray(rawGroup) ? rawGroup.at(-1) : rawGroup;
  const { toast } = useToast();
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [formDataByGroup, setFormDataByGroup] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const { data: settings = [], isLoading: isLoadingSettings } = useFind(
    { entity: EntityType.SETTING },
    {
      hasCount: false,
    },
  );
  const { data: schemas = {}, isLoading: isLoadingSchemas } =
    useApiClientQuery("getSettingSchemas");
  const { mutate: updateSetting } = useUpdate(EntityType.SETTING, {
    onError: (error) => toast.error(error),
    onSuccess: async (data) => {
      if (data.group === "chatbot_settings" && data.label === "license_key") {
        const hasLicenseValue =
          typeof data.value === "string"
            ? data.value.trim().length > 0
            : Boolean(data.value);
        const refreshedUser = await refetchUser();
        const licenseStatus = refreshedUser?.license?.status;

        if (hasLicenseValue && licenseStatus === "active") {
          setIsLicenseModalOpen(true);

          return;
        }

        if (hasLicenseValue && licenseStatus !== "active") {
          toast.error(
            refreshedUser?.license?.lastError ||
              t("message.internal_server_error"),
          );

          return;
        }
      }

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
  const activeTab = useMemo(() => {
    const fallback = DEFAULT_SETTINGS_GROUP;

    if (groups.length === 0) return routeGroup || fallback;
    if (routeGroup && groups.includes(routeGroup)) return routeGroup;

    return groups.includes(fallback) ? fallback : groups[0];
  }, [groups, routeGroup]);

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
    () => debounce(handleUpdate, 400),
    [handleUpdate],
  );

  useEffect(() => () => debouncedUpdate.clear(), [debouncedUpdate]);

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    router.push(`/${RouterType.SETTINGS}/groups/${newValue}`);
  };
  const handleFormDataChange = (
    groupName: string,
    nextFormData: Record<string, unknown>,
  ) => {
    const settingsByLabel = settingsByGroupAndLabel[groupName] || {};

    Object.entries(nextFormData).forEach(([label, nextValue]) => {
      const setting = settingsByLabel[label];

      if (!setting || areSettingValuesEqual(setting.value, nextValue)) return;
      debouncedUpdate(setting.id, nextValue);
    });
  };

  if (isLoadingSettings || isLoadingSchemas) {
    return null;
  }

  return (
    <Grid container gap={3} flexDirection="column">
      <PageHeader icon={SettingsIcon} title={t("title.settings")} />
      <LicenseActivatedModal
        open={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
      />
      <Grid size={12}>
        <Paper variant="spaced">
          <Grid sx={{ display: "flex", maxWidth: "md" }}>
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={activeTab}
              onChange={handleChange}
            >
              {groups.map((group, index) => (
                <Tab
                  value={group}
                  key={group}
                  label={resolveSettingsGroupTitle(group, schemas, t)}
                  {...a11yProps(index)}
                />
              ))}
            </Tabs>
            <StyledFormContainer sx={{ width: "100%", px: 3, paddingY: 2 }}>
              {groups.map((groupName) => {
                const definition = schemas[groupName];
                const schema = definition?.schema as RJSFSchema | undefined;

                return (
                  <TabPanel
                    sx={{ gap: 2 }}
                    value={activeTab}
                    index={groupName}
                    key={groupName}
                  >
                    {!schema ? (
                      <Typography variant="body2" color="text.secondary">
                        {t("message.no_settings_schema")}
                      </Typography>
                    ) : (
                      <FormControl>
                        <JsonSchemaForm
                          schema={schema}
                          formData={formDataByGroup[groupName] || {}}
                          onFormDataChange={(data, errors) => {
                            if (!errors?.length) {
                              handleFormDataChange(groupName, data);
                            }
                          }}
                          uiSchema={buildSettingsUiSchema(schema)}
                          enableJsonataTextWidget={false}
                          idPrefix={`settings-${groupName}`}
                        />
                      </FormControl>
                    )}
                  </TabPanel>
                );
              })}
            </StyledFormContainer>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
