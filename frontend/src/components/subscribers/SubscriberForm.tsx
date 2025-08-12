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
import AutoCompleteEntityDistinctSelect from "@/app-components/inputs/AutoCompleteEntityDistinctSelect";
import { Input } from "@/app-components/inputs/Input";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { ISubscriber, ISubscriberAttributes } from "@/types/subscriber.types";

const getFullName = (subscriber: ISubscriber | null) =>
  `${subscriber?.first_name} ${subscriber?.last_name}`;

export const SubscriberForm: FC<ComponentFormProps<ISubscriber>> = ({
  data: { defaultValues: subscriber },
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
    if (subscriber?.id) {
      updateSubscriber({ id: subscriber.id, params });
    }
  };

  useEffect(() => {
    if (subscriber) {
      reset({ labels: subscriber?.labels });
    }
  }, [subscriber, reset]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <Input
              label={t("label.user")}
              value={subscriber ? getFullName(subscriber) : undefined}
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
                      <AutoCompleteEntityDistinctSelect
                        entity={EntityType.LABEL}
                        subEntity={EntityType.LABEL_GROUP}
                        error={!!errors.labels}
                        helperText={
                          errors.labels ? errors.labels.message : null
                        }
                        onChange={(_e, selected) =>
                          onChange(selected.map(({ id }) => id))
                        }
                        label={t("label.labels")}
                        labelKey="name"
                        sortKey="group"
                        groupKey="name"
                        defaultGroupTitle={t("title.default_group")}
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
