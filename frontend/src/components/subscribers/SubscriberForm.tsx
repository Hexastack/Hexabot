/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Button, Grid, Link } from "@mui/material";
import { FC, Fragment, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Input } from "@/app-components/inputs/Input";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { ILabel } from "@/types/label.types";
import { ISubscriber, ISubscriberAttributes } from "@/types/subscriber.types";

const getFullName = (subscriber: ISubscriber | null) =>
  `${subscriber?.first_name} ${subscriber?.last_name}`;

export const SubscriberForm: FC<ComponentFormProps<ISubscriber>> = ({
  data,
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { mutate: updateSubscriber } = useUpdate(EntityType.SUBSCRIBER, {
    onError: () => {
      rest.onError?.();
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  });
  const {
    reset,
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<ISubscriberAttributes>();
  const onSubmitForm = (params: ISubscriberAttributes) => {
    if (data?.id) {
      updateSubscriber({ id: data.id, params });
    }
  };

  useEffect(() => {
    if (data) {
      reset({ labels: data?.labels });
    }
  }, [data, reset]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <Input
              label={t("label.user")}
              value={getFullName(data)}
              disabled
              InputProps={{
                readOnly: true,
              }}
            />
          </ContentItem>
          <ContentItem>
            <Grid container gap="20px">
              <Grid item xs>
                <Controller
                  name="labels"
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
                  control={control}
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
      </form>
    </Wrapper>
  );
};
