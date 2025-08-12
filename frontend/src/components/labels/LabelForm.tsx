/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  createFilterOptions,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { FC, Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  ConfirmDialogBody,
  ContentContainer,
  ContentItem,
} from "@/app-components/dialogs";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useDelete } from "@/hooks/crud/useDelete";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useDialogs } from "@/hooks/useDialogs";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { ILabelGroup } from "@/types/label-group.types";
import { ILabel, ILabelAttributes } from "@/types/label.types";
import { slugify } from "@/utils/string";

const filter = createFilterOptions<ILabelGroup>();

export const LabelForm: FC<ComponentFormProps<ILabel>> = ({
  data: { defaultValues: label },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const options = {
    onError: (error: Error) => {
      rest.onError?.();
      toast.error(error);
    },
    onSuccess: () => {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  };
  const addLabelGroupTitle = t("button.add");
  const [labelGroup, setLabelGroup] = useState<string | null>(
    label?.group || null,
  );
  const { mutate: createLabel } = useCreate(EntityType.LABEL, options);
  const { mutate: createGroupLabel } = useCreate(EntityType.LABEL_GROUP, {
    onSuccess: (createdGroup: ILabelGroup) => {
      toast.success(t("message.success_save"));
      // Automatically select the newly created group label
      setLabelGroup(createdGroup.id);
    },
  });
  const { mutate: deleteGroupLabel } = useDelete(EntityType.LABEL_GROUP, {
    onSuccess: () => {
      toast.success(t("message.item_delete_success"));
    },
  });
  const { mutate: updateLabel } = useUpdate(EntityType.LABEL, options);
  const {
    reset,
    register,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm<ILabelAttributes>({
    defaultValues: {
      name: label?.name || "",
      title: label?.title || "",
      description: label?.description || "",
    },
  });
  const validationRules = {
    title: {
      required: t("message.title_is_required"),
    },
    name: {},
    description: {},
  };
  const onSubmitForm = (params: ILabelAttributes) => {
    if (label) {
      updateLabel({
        id: label.id,
        params: {
          group: labelGroup,
          ...params,
        },
      });
    } else {
      createLabel({ group: labelGroup, ...params });
    }
  };

  useEffect(() => {
    if (label) {
      reset({
        name: label.name,
        title: label.title,
        description: label.description,
      });
    } else {
      reset();
    }
  }, [label, reset]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <Input
              label={t("placeholder.title")}
              error={!!errors.title}
              required
              autoFocus
              {...register("title", validationRules.title)}
              InputProps={{
                onChange: ({ target: { value } }) => {
                  setValue("title", value);
                  setValue("name", slugify(value).toUpperCase());
                },
              }}
              helperText={errors.title ? errors.title.message : null}
            />
          </ContentItem>
          <AutoCompleteEntitySelect<ILabelGroup, "name", false>
            fullWidth={true}
            searchFields={["name"]}
            disableSearch
            entity={EntityType.LABEL_GROUP}
            format={Format.BASIC}
            labelKey="name"
            label={t("title.group_label")}
            multiple={false}
            value={labelGroup}
            onChange={(_e, selected) => {
              if (selected && !selected.id && "name" in selected) {
                createGroupLabel({
                  name: selected.name.slice(addLabelGroupTitle.length + 2, -1),
                });
              } else {
                setLabelGroup(selected?.id || null);
              }
            }}
            filterOptions={(options, params) => {
              const filtered = filter(options, params);
              const { inputValue } = params;
              const isExisting = options.some(
                (option) => inputValue === option.name,
              );

              if (inputValue !== "" && !isExisting) {
                filtered.push({
                  id: "",
                  name: `${addLabelGroupTitle} "${inputValue}"`,
                  format: Format.BASIC,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
              }

              return filtered;
            }}
            renderOption={(props, { id, name }) => (
              <ListItem {...props} key={id}>
                <ListItemText primary={name} />
                {id ? (
                  <InputAdornment
                    position="end"
                    onClick={async () => {
                      const isConfirmed = await dialogs.confirm(
                        ConfirmDialogBody,
                      );

                      if (isConfirmed) {
                        deleteGroupLabel(id);
                      }
                    }}
                  >
                    <Tooltip title={t("button.delete")} placement="left" arrow>
                      <IconButton size="small" sx={{ marginRight: 1 }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ) : null}
              </ListItem>
            )}
            isDisabledWhenEmpty={false}
          />
          <ContentItem>
            <Input
              placeholder={t("placeholder.name")}
              error={!!errors.name}
              {...register("name", validationRules.name)}
              disabled
              helperText={errors.name ? errors.name.message : null}
            />
          </ContentItem>
          <ContentItem>
            <Input
              label={t("label.description")}
              error={!!errors.description}
              {...register("description", validationRules.description)}
              helperText={
                errors.description ? errors.description.message : null
              }
              multiline={true}
            />
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
