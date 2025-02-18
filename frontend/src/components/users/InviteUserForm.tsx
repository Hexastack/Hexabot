/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, Fragment } from "react";
import { Controller, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Input } from "@/app-components/inputs/Input";
import { useSendInvitation } from "@/hooks/entities/invitation-hooks";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { useValidationRules } from "@/hooks/useValidationRules";
import { EntityType, Format } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { IInvitationAttributes } from "@/types/invitation.types";
import { IRole } from "@/types/role.types";

const DEFAULT_VALUES: IInvitationAttributes = { email: "", roles: [] };

export const InviteUserForm: FC<ComponentFormProps<undefined>> = ({
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { mutate: sendInvitation } = useSendInvitation({
    onSuccess: () => {
      rest.onSuccess?.();
      toast.success(t("message.success_invitation_sent"));
    },
    onError: () => {
      rest.onError?.();
      toast.error(t("message.internal_server_error"));
    },
  });
  const {
    control,
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<IInvitationAttributes>({
    defaultValues: DEFAULT_VALUES,
  });
  const rules = useValidationRules();
  const validationRules = {
    email: {
      ...rules.email,
      required: t("message.email_is_required"),
    },
    roles: {
      required: t("message.roles_is_required"),
    },
  };
  const onSubmitForm = (params: IInvitationAttributes) =>
    sendInvitation(params);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <Input
              label={t("placeholder.email")}
              error={!!errors.email}
              required
              autoFocus
              {...register("email", validationRules.email)}
              helperText={errors.email ? errors.email.message : null}
            />
          </ContentItem>
          <ContentItem>
            <Controller
              name="roles"
              rules={validationRules.roles}
              control={control}
              render={({ field }) => {
                const { onChange, ...rest } = field;

                return (
                  <AutoCompleteEntitySelect<IRole>
                    autoFocus
                    searchFields={["name"]}
                    entity={EntityType.ROLE}
                    format={Format.BASIC}
                    labelKey="name"
                    label={t("label.roles")}
                    multiple={true}
                    {...field}
                    error={!!errors.roles}
                    helperText={errors.roles ? errors.roles.message : null}
                    onChange={(_e, selected) =>
                      onChange(selected.map(({ id }) => id))
                    }
                    {...rest}
                  />
                );
              }}
            />
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
