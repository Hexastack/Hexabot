/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TextField } from "@mui/material";
import Grid from "@mui/material/Grid";
import { FC, Fragment, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { WithEntityButton } from "@/app-components/buttons/entities/WithEntityButton";
import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntityDistinctSelect from "@/app-components/inputs/AutoCompleteEntityDistinctSelect";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { isCountOrCollectionQuery } from "@/hooks/useEntityMutationSubscription";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { PermissionAction } from "@/types/permission.types";
import { ISubscriber, ISubscriberAttributes } from "@/types/subscriber.types";

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
    if (subscriber?.id)
      updateSubscriber(
        { id: subscriber.id, params },
        {
          onSuccess(_d, _v, _o, context) {
            context.client.refetchQueries({
              predicate: ({ queryKey }) =>
                isCountOrCollectionQuery(queryKey, EntityType.SUBSCRIBER),
            });
          },
        },
      );
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
            <TextField
              label={t("label.user")}
              value={subscriber?.fullName}
              disabled
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />
          </ContentItem>
          <ContentItem>
            <Grid container gap={2}>
              <Grid size="grow">
                <Controller
                  name="labels"
                  render={({ field }) => {
                    const { onChange, ...rest } = field;

                    return (
                      <WithEntityButton
                        entity={EntityType.LABEL}
                        permissionAction={PermissionAction.CREATE}
                        enableEntityAddButton
                      >
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
                          labelKey="title"
                          sortKey="group"
                          groupKey="name"
                          defaultGroupTitle={t("title.default_group")}
                          {...rest}
                        />
                      </WithEntityButton>
                    );
                  }}
                  control={control}
                />
              </Grid>
            </Grid>
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
