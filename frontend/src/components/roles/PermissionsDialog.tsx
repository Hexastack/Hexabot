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
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";
import { FC, useEffect, useState } from "react";

import { IconButton } from "@/app-components/buttons/IconButton";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { IPermission, IPermissionAttributes } from "@/types/permission.types";
import { IRole } from "@/types/role.types";

export type PermissionsDialogProps = DialogControlProps<{
  role: IRole;
}>;

const DEFAULT_PAYLOAD: IPermissionAttributes = {
  action: "",
  model: "",
  relation: "",
  role: "",
};
const AccordionModelHead = () => (
  <Grid container direction="row" minHeight="35px" alignContent="center" mb={1}>
    <Grid item width="96px" />
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

export const PermissionsDialog: FC<PermissionsDialogProps> = ({
  open,
  datum: permission,
  closeDialog: closeFunction,
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
  const { mutateAsync: createPermission } = useCreate(EntityType.PERMISSION, {
    onError: (error: Error & { statusCode?: number }) => {
      if (error.statusCode === 409) {
        toast.error(t("message.permission_already_exists"));
      } else {
        toast.error(t("message.internal_server_error"));
      }
    },
    onSuccess: () => {
      modelRefetch();
      toast.success(t("message.success_save"));
    },
  });
  const { mutateAsync: deletePermission } = useDelete(EntityType.PERMISSION, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: () => {
      modelRefetch();
      toast.success(t("message.item_delete_success"));
    },
  });
  const [expanded, setExpanded] = useState<string | false>(false);
  const [payload, setPayload] =
    useState<IPermissionAttributes>(DEFAULT_PAYLOAD);
  const reset = () => setPayload(DEFAULT_PAYLOAD);
  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  useEffect(() => {
    if (expanded === false && models?.[0]?.id) setExpanded(models[0].id);
  }, [models]);

  return (
    <Dialog
      open={open}
      fullWidth
      onClose={closeFunction}
      sx={{ maxWidth: "850px", margin: "auto" }}
      maxWidth="md"
    >
      <DialogTitle onClose={closeFunction}>
        {t("title.manage_permissions")}
      </DialogTitle>
      <DialogContent>
        <Typography fontWeight={700} sx={{ marginBottom: 2 }}>
          {permission?.role.name}
        </Typography>
        {models?.map((model) => {
          return (
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
                    padding: 2,
                  }}
                >
                  <AccordionModelHead />
                  {model.permissions
                    ?.map((p) => getPermissionFromCache(p))
                    ?.filter((p) => p && p.role === permission?.role.id)
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
                            <Grid item width="96px">
                              <IconButton
                                variant="text"
                                color="error"
                                onClick={() => {
                                  deletePermission(id);
                                }}
                                size="small"
                              >
                                <DeleteOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Grid>
                            <Grid item xs>
                              <Typography>{action}</Typography>
                            </Grid>
                            <Grid item xs>
                              <Typography>{relation}</Typography>
                            </Grid>
                          </Grid>
                        </>
                      );
                    })}
                  <Grid container minHeight="40px" padding={1}>
                    <Grid item width="96px" alignContent="center">
                      <IconButton
                        size="small"
                        color="primary"
                        variant="contained"
                        onClick={() => {
                          if (permission?.role.id)
                            createPermission({
                              ...payload,
                              model: model.id,
                              role: permission.role.id,
                            });
                          reset();
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                    <Grid item xs alignContent="center">
                      <Input
                        select
                        sx={{ width: "110px" }}
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
                        sx={{ width: "110px" }}
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
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={closeFunction}>
          {t("button.close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
