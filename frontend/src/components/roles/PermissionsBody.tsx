/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";
import { FC, Fragment, useEffect, useState } from "react";

import { IconButton } from "@/app-components/buttons/IconButton";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { IPermission, IPermissionAttributes } from "@/types/permission.types";
import { IRole } from "@/types/role.types";

const DEFAULT_PAYLOAD: IPermissionAttributes = {
  action: "",
  model: "",
  relation: "",
  role: "",
};
const AccordionModelHead = () => (
  <Grid
    container
    direction="row"
    minHeight="3rem"
    alignContent="center"
    bgcolor="#0001"
  >
    <Grid item width="6rem" m="0.2rem" />
    <Grid item xs textAlign="left">
      <Typography fontWeight={700} fontSize="body2.fontSize">
        Action
      </Typography>
    </Grid>
    <Grid item xs textAlign="left">
      <Typography fontWeight={700} fontSize="body2.fontSize">
        Relation
      </Typography>
    </Grid>
  </Grid>
);

export const PermissionsBody: FC<ComponentFormProps<IRole>> = ({
  data: { defaultValues: role },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { data: models, refetch: modelRefetch } = useFind(
    { entity: EntityType.MODEL, format: Format.FULL },
    {
      hasCount: false,
    },
  );
  const getPermissionFromCache = useGetFromCache(EntityType.PERMISSION);
  const options = {
    onError: (error: Error) => {
      toast.error(error);
    },
    onSuccess: () => {
      modelRefetch();
      toast.success(t("message.success_save"));
    },
  };
  const { mutate: createPermission } = useCreate(EntityType.PERMISSION, {
    ...options,
    onError: (error: Error & { statusCode?: number }) => {
      rest.onError?.();
      if (error.statusCode === 409) {
        toast.error(t("message.permission_already_exists"));
      } else {
        toast.error(error);
      }
    },
  });
  const { mutate: deletePermission } = useDelete(
    EntityType.PERMISSION,
    options,
  );
  const [expanded, setExpanded] = useState<string | undefined>();
  const [payload, setPayload] =
    useState<IPermissionAttributes>(DEFAULT_PAYLOAD);
  const reset = () => setPayload(DEFAULT_PAYLOAD);
  const handleChange = (panel: string) => () => {
    setExpanded(panel === expanded ? "" : panel);
    setPayload(DEFAULT_PAYLOAD);
  };

  useEffect(() => {
    if (typeof expanded !== "string" && models?.[0]?.id) {
      setExpanded(models[0].id);
    }
  }, [models]);

  return (
    <Wrapper onSubmit={() => {}} {...WrapperProps}>
      <Typography fontWeight={700} sx={{ marginBottom: 2 }}>
        {role?.name}
      </Typography>
      {models?.map((model) => (
        <Accordion
          key={model.id}
          expanded={expanded === model.id}
          onChange={handleChange(model.id)}
          sx={{
            marginTop: 1,
            boxShadow: "none",
            "&:before": {
              display: "none",
            },
          }}
        >
          <AccordionSummary
            expandIcon={<KeyboardArrowUpIcon />}
            sx={{
              backgroundColor: "background.default",
              borderRadius: 1,
              fontFamily: "inherit",
            }}
          >
            <Typography>{model.name}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0, m: 0 }}>
            <Paper
              sx={{
                m: 2,
                border: "1px solid #0002",
              }}
            >
              <AccordionModelHead />
              {model.permissions
                ?.map((p) => getPermissionFromCache(p))
                ?.filter(
                  (permission) => permission && permission.role === role?.id,
                )
                .map((p) => p as IPermission)
                .map(({ id, action, relation }, index) => {
                  return (
                    <>
                      {index > 0 && <Divider />}
                      <Grid
                        container
                        key={id}
                        sx={{
                          borderRadius: 0.8,
                          padding: 1,
                          "&:hover": {
                            backgroundColor: "background.default",
                          },
                        }}
                        alignItems="center"
                      >
                        <Grid item width="6rem">
                          <IconButton
                            variant="text"
                            color="error"
                            onClick={() => deletePermission(id)}
                            size="small"
                          >
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Grid>
                        <Grid item xs>
                          <Typography>{action}</Typography>
                        </Grid>
                        <Grid item xs>
                          <Typography sx={{ ml: "0.2rem" }}>
                            {relation}
                          </Typography>
                        </Grid>
                      </Grid>
                    </>
                  );
                })}
              <Grid
                container
                minHeight="2.5rem"
                padding="1rem 0"
                borderTop="1px solid #0002"
              >
                <Grid item width="6rem" alignContent="center" pl="0.6rem">
                  <IconButton
                    size="small"
                    color="primary"
                    variant="contained"
                    onClick={() => {
                      if (role?.id)
                        createPermission({
                          ...payload,
                          role: role.id,
                          model: model.id,
                        });
                      reset();
                    }}
                    disabled={!payload.action || !payload.relation}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Grid>
                <Grid item xs alignContent="center">
                  <Input
                    select
                    sx={{ width: "6.875rem" }}
                    label="Action"
                    value={payload.action}
                    onChange={(e) => {
                      if (e.target.value)
                        setPayload((currentPayload) => ({
                          ...currentPayload,
                          action: e.target.value,
                        }));
                    }}
                  >
                    <MenuItem value="create">{t("label.create")}</MenuItem>
                    <MenuItem value="read">{t("label.read")}</MenuItem>
                    <MenuItem value="update">{t("label.update")}</MenuItem>
                    <MenuItem value="delete">{t("label.delete")}</MenuItem>
                  </Input>
                </Grid>
                <Grid item xs alignContent="center">
                  <Input
                    select
                    sx={{ width: "6.875rem" }}
                    label={t("label.relation")}
                    value={payload.relation}
                    onChange={(e) => {
                      if (e.target.value)
                        setPayload((currentPayload) => ({
                          ...currentPayload,
                          relation: e.target.value,
                        }));
                    }}
                  >
                    <MenuItem value="role">{t("label.role")}</MenuItem>
                  </Input>
                </Grid>
              </Grid>
            </Paper>
          </AccordionDetails>
        </Accordion>
      ))}
    </Wrapper>
  );
};
