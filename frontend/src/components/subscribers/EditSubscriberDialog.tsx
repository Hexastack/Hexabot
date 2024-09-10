/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
} from "@mui/material";
import Link from "next/link";
import { useEffect, FC, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import DialogButtons from "@/app-components/buttons/DialogButtons";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { ContentContainer } from "@/app-components/dialogs/layouts/ContentContainer";
import { ContentItem } from "@/app-components/dialogs/layouts/ContentItem";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Input } from "@/app-components/inputs/Input";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
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
  data,
  closeDialog,
  ...rest
}) => {
  const { t } = useTranslation();
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
    if (data?.subscriber.id)
      updateSubscriber({ id: data?.subscriber.id, params });
  };

  useEffect(() => {
    if (data?.subscriber) setFullName(getFullName(data?.subscriber));

    if (open) {
      reset({ labels: data?.subscriber?.labels });
    }
  }, [open, reset, data]);

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
