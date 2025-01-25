/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */


import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
} from "@mui/material";
import Link from "next/link";
import { FC, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import DialogButtons from "@/app-components/buttons/DialogButtons";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { ContentContainer } from "@/app-components/dialogs/layouts/ContentContainer";
import { ContentItem } from "@/app-components/dialogs/layouts/ContentItem";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Input } from "@/app-components/inputs/Input";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { ILabel } from "@/types/label.types";
import { ISubscriber, ISubscriberAttributes } from "@/types/subscriber.types";

const getFullName = (val: ISubscriber) => `${val.first_name} ${val.last_name}`;

export type EditSubscriberDialogProps = DialogControlProps<{
  labels: ILabel[];
  subscriber: ISubscriber;
}>;
export const EditSubscriberDialog: FC<EditSubscriberDialogProps> = ({
  open,
  datum,
  closeDialog,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState<string>("");
  const { mutateAsync: updateSubscriber } = useUpdate(EntityType.SUBSCRIBER, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      closeDialog();
      toast.success(t("message.success_save"));
    },
  });
  const {
    reset,
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<ISubscriberAttributes>();
  const validationRules = {
    labels: {},
  };
  const onSubmitForm = async (params: ISubscriberAttributes) => {
    if (datum?.subscriber.id)
      updateSubscriber({ id: datum?.subscriber.id, params });
  };

  useEffect(() => {
    if (datum?.subscriber) setFullName(getFullName(datum?.subscriber));

    if (open) {
      reset({ labels: datum?.subscriber?.labels });
    }
  }, [open, reset, datum]);

  return (
    <Dialog open={open} fullWidth onClose={closeDialog} {...rest}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={closeDialog}>
          {t("title.manage_labels")}
        </DialogTitle>
        <DialogContent>
          <ContentContainer>
            <ContentItem>
              <Input
                label={t("label.auth_user")}
                disabled
                InputProps={{
                  readOnly: true,
                }}
                value={fullName}
              />
            </ContentItem>
            <ContentItem>
              <Grid container gap="20px">
                <Grid item xs>
                  <Controller
                    name="labels"
                    rules={validationRules.labels}
                    control={control}
                    render={({ field }) => {
                      const { onChange, ...rest } = field;

                      return (
                        <AutoCompleteEntitySelect<ILabel>
                          autoFocus
                          searchFields={["name"]}
                          entity={EntityType.LABEL}
                          format={Format.BASIC}
                          labelKey="name"
                          label={t("label.labels")}
                          multiple
                          {...field}
                          error={!!errors.labels}
                          helperText={
                            errors.labels ? errors.labels.message : null
                          }
                          onChange={(_e, selected) =>
                            onChange(selected.map(({ id }) => id))
                          }
                          {...rest}
                        />
                      );
                    }}
                  />
                </Grid>
                <Grid alignContent="center">
                  <Link href="/subscribers/labels">
                    <Button variant="contained">{t("button.manage")}</Button>
                  </Link>
                </Grid>
              </Grid>
            </ContentItem>
          </ContentContainer>
        </DialogContent>
        <DialogActions>
          <DialogButtons closeDialog={closeDialog} />
        </DialogActions>
      </form>
    </Dialog>
  );
};
