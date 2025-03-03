/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faCogs } from "@fortawesome/free-solid-svg-icons";
import {
  debounce,
  FormControl,
  Grid,
  Paper,
  styled,
  Tab,
  Tabs,
} from "@mui/material";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { a11yProps, TabPanel } from "@/app-components/tabs/TabPanel";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType, RouterType } from "@/services/types";
import { ISetting } from "@/types/setting.types";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

import SettingInput from "./SettingInput";

const StyledTab = styled(Tab)(
  SXStyleOptions({
    alignItems: "center",
    textTransform: "none",
    borderRadius: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    paddingX: 2,
    paddingY: 1,
    borderRight: "1px solid",
    borderColor: "grey[100]",
    "& p": {
      color: "grey[600]",
    },
    "&:hover": {
      backgroundColor: "grey.100",
    },
    "&.Mui-selected": {
      backgroundColor: "teal.50",
      "& p": {
        color: "primary.main",
      },
    },
  }),
);
const StyledForm = styled("form")();

function groupBy(array: ISetting[]) {
  return array.reduce((acc, curr) => {
    acc[curr.group] = acc[curr.group] ? acc[curr.group].concat(curr) : [curr];

    return acc;
  }, {} as Record<string, ISetting[]>);
}

const DEFAULT_SETTINGS_GROUP = "chatbot_settings" as const;

export const Settings = () => {
  const { t } = useTranslate();
  const router = useRouter();
  const group = router.query.group?.toString();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState(
    group || DEFAULT_SETTINGS_GROUP,
  );
  const { control, watch } = useForm();
  const { data: settings } = useFind(
    { entity: EntityType.SETTING },
    {
      hasCount: false,
      initialSortState: [{ field: "weight", sort: "asc" }],
    },
  );
  const { mutate: updateSetting } = useUpdate(EntityType.SETTING, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: () => {
      toast.success(t("message.success_save"));
    },
  });
  const groups = useMemo(() => {
    return groupBy(settings || []);
  }, [settings]);
  const handleUpdate = (setting: ISetting, newValue: any) => {
    updateSetting({ id: setting.id, params: { value: newValue } });
  };
  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
    router.push(`/${RouterType.SETTINGS}/groups/${newValue}`);
  };
  const isDisabled = (setting: ISetting) => {
    return (
      setting.group === "nlp_settings" &&
      setting.label === "endpoint" &&
      getSettingValue("provider") === "wit"
    );
  };
  const getSettingValue = (label: string) => {
    const setting = (settings || []).find((s) => s.label === label);

    return setting ? setting.value : false;
  };
  const debouncedUpdate = useCallback(
    debounce((group, label, value) => {
      const setting = (settings || []).find(
        (s) => s.group === group && s.label === label,
      );

      if (setting) {
        handleUpdate(setting, value);
      } else {
        throw new Error(`Unable to update setting ${name}`);
      }
    }, 400),
    [settings, handleUpdate],
  );

  useEffect(() => {
    const subscription = watch((values, { name }) => {
      const [group, label] = (name as string).split(".");

      debouncedUpdate(group, label, values[group][label]);
    });

    return () => {
      subscription.unsubscribe();
      debouncedUpdate.clear();
    };
  }, [watch, debouncedUpdate]);

  useEffect(() => {
    setSelectedTab(group || DEFAULT_SETTINGS_GROUP);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  return (
    <Grid container gap={3} flexDirection="column">
      <PageHeader icon={faCogs} title={t("title.settings")} />
      <Grid item xs={12}>
        <Paper sx={{ padding: 3 }}>
          <Grid sx={{ display: "flex", maxWidth: "md" }}>
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={selectedTab}
              onChange={handleChange}
              sx={{
                "& .MuiTabs-flexContainer": {
                  padding: 0,
                  paddingRight: 0.2,
                },
                "& .MuiTabs-indicator": {
                  width: "3px",
                },
              }}
            >
              {Object.keys(groups)
                .sort((a, b) => a.localeCompare(b))
                .map((group, index) => (
                  <StyledTab
                    value={group}
                    key={group}
                    label={t(`title.${group}`, { ns: group })}
                    {...a11yProps(index)}
                  />
                ))}
            </Tabs>
            <StyledForm sx={{ width: "100%", px: 3, paddingY: 2 }}>
              {Object.entries(groups).map(([group, settings]) => (
                <TabPanel
                  sx={{ gap: 2 }}
                  value={selectedTab}
                  index={group}
                  key={group}
                >
                  {settings.map((setting) => (
                    <Controller
                      key={setting.id}
                      name={`${setting.group}.${setting.label}`}
                      control={control}
                      defaultValue={setting.value}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <SettingInput
                            setting={setting}
                            field={field}
                            ns={setting.group}
                            isDisabled={isDisabled}
                          />
                        </FormControl>
                      )}
                    />
                  ))}
                </TabPanel>
              ))}
            </StyledForm>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
