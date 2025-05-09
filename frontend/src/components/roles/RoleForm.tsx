/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, Fragment, useEffect } from "react";
import { useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { IRole, IRoleAttributes } from "@/types/role.types";

export const RoleForm: FC<ComponentFormProps<IRole>> = ({
  data: { defaultValues: role },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const options = {
    onError: (error: Error) => {
      toast.error(error);
    },
    onSuccess() {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  };
  const { mutate: createRole } = useCreate(EntityType.ROLE, options);
  const { mutate: updateRole } = useUpdate(EntityType.ROLE, options);
  const {
    handleSubmit,
    reset,
    register,
    formState: { errors },
  } = useForm<IRoleAttributes>({
    defaultValues: { name: "" },
  });
  const validationRules = {
    name: {
      required: t("message.name_is_required"),
    },
  };
  const onSubmitForm = (params: IRoleAttributes) => {
    if (role) {
      updateRole({ id: role.id, params });
    } else {
      createRole(params);
    }
  };

  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
      });
    } else {
      reset();
    }
  }, [role, reset]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <Input
              label={t("placeholder.name")}
              error={!!errors.name}
              required
              autoFocus
              helperText={errors.name ? errors.name.message : null}
              {...register("name", validationRules.name)}
            />
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
