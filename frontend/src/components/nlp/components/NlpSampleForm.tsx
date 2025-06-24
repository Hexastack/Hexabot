/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Chip,
  debounce,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { FC, Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useQuery } from "react-query";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import AutoCompleteSelect from "@/app-components/inputs/AutoCompleteSelect";
import Selectable from "@/app-components/inputs/Selectable";
import { useCreate } from "@/hooks/crud/useCreate";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useApiClient } from "@/hooks/useApiClient";
import { useNlp } from "@/hooks/useNlp";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import {
  ComponentFormProps,
  FormButtonsProps,
} from "@/types/common/dialogs.types";
import { ILanguage } from "@/types/language.types";
import { INlpEntity } from "@/types/nlp-entity.types";
import {
  INlpDatasetKeywordEntity,
  INlpDatasetPatternEntity,
  INlpDatasetSample,
  INlpDatasetSampleAttributes,
  INlpDatasetTraitEntity,
  INlpSample,
  INlpSampleFormAttributes,
  INlpSampleFull,
  NlpSampleType,
} from "@/types/nlp-sample.types";
import { INlpValue } from "@/types/nlp-value.types";

export const NlpSampleForm: FC<ComponentFormProps<INlpDatasetSample>> = ({
  data: { defaultValues: nlpDatasetSample },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const options = {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: () => {
      toast.success(t("message.success_save"));
    },
  };
  const { mutate: createSample } = useCreate<
    EntityType.NLP_SAMPLE,
    INlpDatasetSampleAttributes,
    INlpSample,
    INlpSampleFull
  >(EntityType.NLP_SAMPLE, {
    ...options,
    onSuccess: () => {
      options.onSuccess();
      refetchAllEntities();
      reset({
        ...defaultValues,
        text: "",
      });
    },
  });
  const { mutate: updateSample } = useUpdate<
    EntityType.NLP_SAMPLE,
    INlpDatasetSampleAttributes
  >(EntityType.NLP_SAMPLE, options);
  const {
    allTraitEntities,
    allKeywordEntities,
    allPatternEntities,
    refetchAllEntities,
  } = useNlp();
  const getNlpValueFromCache = useGetFromCache(EntityType.NLP_VALUE);
  const defaultValues: INlpSampleFormAttributes = useMemo(
    () => ({
      type: nlpDatasetSample?.type || NlpSampleType.train,
      text: nlpDatasetSample?.text || "",
      language: nlpDatasetSample?.language || null,
      traitEntities: [...allTraitEntities.values()].map((e) => {
        return {
          entity: e.name,
          value:
            (nlpDatasetSample?.entities || []).find(
              (se) => se.entity === e.name,
            )?.value || "",
        };
      }) as INlpDatasetTraitEntity[],
      keywordEntities: (nlpDatasetSample?.entities || []).filter((e) =>
        allKeywordEntities.has(e.entity),
      ) as INlpDatasetKeywordEntity[],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allKeywordEntities, allTraitEntities, JSON.stringify(nlpDatasetSample)],
  );
  const { handleSubmit, control, register, reset, setValue, watch } =
    useForm<INlpSampleFormAttributes>({
      defaultValues,
    });
  const currentText = watch("text");
  const currentType = watch("type");
  const { apiClient } = useApiClient();
  const [patternEntities, setPatternEntities] = useState<
    INlpDatasetPatternEntity[]
  >([]);
  const { fields: traitEntities, update: updateTraitEntity } = useFieldArray({
    control,
    name: "traitEntities",
  });
  const {
    fields: keywordEntities,
    insert: insertKeywordEntity,
    update: updateKeywordEntity,
    remove: removeKeywordEntity,
  } = useFieldArray({
    control,
    name: "keywordEntities",
  });
  // Auto-predict on text change
  const debounceSetText = useCallback(
    debounce((text: string) => {
      setValue("text", text);
    }, 400),
    [setValue],
  );
  const { isLoading } = useQuery({
    queryKey: ["nlp-prediction", currentText],
    queryFn: async () => {
      return await apiClient.predictNlp(currentText);
    },
    onSuccess: (prediction) => {
      const predictedTraitEntities: INlpDatasetTraitEntity[] =
        prediction.entities.filter((e) => allTraitEntities.has(e.entity));
      const predictedKeywordEntities = prediction.entities.filter((e) =>
        allKeywordEntities.has(e.entity),
      ) as INlpDatasetKeywordEntity[];
      const predictedPatternEntities = prediction.entities.filter((e) =>
        allPatternEntities.has(e.entity),
      ) as INlpDatasetKeywordEntity[];
      const language = prediction.entities.find(
        ({ entity }) => entity === "language",
      );

      setValue("language", language?.value || "");
      setValue("traitEntities", predictedTraitEntities);
      setValue("keywordEntities", predictedKeywordEntities);
      setPatternEntities(predictedPatternEntities);
    },
    enabled:
      // Inbox sample update
      nlpDatasetSample?.type === "inbox" ||
      // New sample
      (!nlpDatasetSample && !!currentText),
  });
  const findInsertIndex = (newItem: INlpDatasetKeywordEntity): number => {
    const index = keywordEntities.findIndex(
      (entity) => entity.start && newItem.start && entity.start > newItem.start,
    );

    return index === -1 ? keywordEntities.length : index;
  };
  const [selection, setSelection] = useState<{
    value: string;
    start: number;
    end: number;
  } | null>(null);
  const onSubmitForm = async (form: INlpSampleFormAttributes) => {
    if (nlpDatasetSample?.id) {
      updateSample(
        {
          id: nlpDatasetSample.id,
          params: {
            text: form.text,
            type: form.type,
            entities: [...form.keywordEntities, ...form.traitEntities],
            language: form.language,
          },
        },
        {
          onSuccess: () => {
            rest.onSuccess?.();
          },
        },
      );
    } else {
      createSample({
        text: form.text,
        type: form.type,
        entities: [...form.traitEntities, ...form.keywordEntities],
        language: form.language,
      });
    }
  };

  useEffect(() => {
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultValues)]);

  const cancelButtonProps = {
    sx: {
      display: "inline-block",
      overflow: "hidden",
      textAlign: "left",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      "& .MuiButton-startIcon": {
        top: "4px",
        margin: "auto 4px auto auto",
        display: "inline-block",
        position: "relative",
      },
    },
    color: "secondary",
    variant: "contained",
    onClick: () => {
      const newKeywordEntity = {
        ...selection,
        entity: "",
      } as INlpDatasetKeywordEntity;
      const newIndex = findInsertIndex(newKeywordEntity);

      selection && insertKeywordEntity(newIndex, newKeywordEntity);
      setSelection(null);
    },
    disabled: !selection?.value,
    startIcon: <AddIcon />,
  } satisfies FormButtonsProps["cancelButtonProps"];
  const confirmButtonProps = {
    sx: { minWidth: "120px" },
    value: "button.validate",
    variant: "contained",
    disabled: !(
      currentText !== "" &&
      currentType !== NlpSampleType.inbox &&
      traitEntities.every((e) => e.value !== "") &&
      keywordEntities.every((e) => e.value !== "")
    ),
    onClick: handleSubmit(onSubmitForm),
  } satisfies FormButtonsProps["confirmButtonProps"];

  return (
    <Wrapper
      onSubmit={() => {}}
      {...WrapperProps}
      cancelButtonProps={{
        ...WrapperProps?.cancelButtonProps,
        text: !selection?.value
          ? t("button.select_some_text")
          : t("button.add_nlp_entity", { 0: selection.value }),
        ...cancelButtonProps,
      }}
      confirmButtonProps={{
        ...WrapperProps?.confirmButtonProps,
        ...confirmButtonProps,
      }}
    >
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
          >
            <Typography variant="h6" display="inline-block">
              {t("title.nlp_train")}
            </Typography>
            <FormControl>
              <FormLabel>{t("label.type")}</FormLabel>
              <RadioGroup
                row
                defaultValue={
                  nlpDatasetSample?.type === NlpSampleType.test
                    ? NlpSampleType.test
                    : NlpSampleType.train
                }
              >
                {Object.values(NlpSampleType)
                  .filter((type) => type !== "inbox")
                  .map((type, index) => (
                    <FormControlLabel
                      key={index}
                      value={type}
                      control={<Radio {...register("type")} />}
                      label={t(`label.${type}`)}
                    />
                  ))}
              </RadioGroup>
            </FormControl>
          </ContentItem>
          <ContentItem>
            <Selectable
              defaultValue={currentText}
              keywordEntities={keywordEntities}
              patternEntities={patternEntities}
              placeholder={t("placeholder.nlp_sample_text")}
              onSelect={(newSelection, start, end) => {
                newSelection !== selection?.value &&
                  setSelection({
                    value: newSelection,
                    start,
                    end,
                  });
              }}
              onChange={({ text, entities }) => {
                debounceSetText(text);
                setValue(
                  "keywordEntities",
                  entities.map(({ entity, value, start, end }) => ({
                    entity,
                    value,
                    start,
                    end,
                  })),
                );
                setPatternEntities([]);
              }}
              loading={isLoading}
            />
          </ContentItem>
          <Box display="flex" flexDirection="column">
            <ContentItem
              display="flex"
              flexDirection="row"
              maxWidth="50%"
              gap={2}
            >
              <Controller
                name="language"
                control={control}
                render={({ field }) => {
                  const { onChange, ...rest } = field;

                  return (
                    <AutoCompleteEntitySelect<ILanguage, "title", false>
                      fullWidth={true}
                      autoFocus
                      searchFields={["title", "code"]}
                      entity={EntityType.LANGUAGE}
                      format={Format.BASIC}
                      labelKey="title"
                      idKey="code"
                      label={t("label.language")}
                      multiple={false}
                      {...field}
                      onChange={(_e, selected) => {
                        onChange(selected?.code);
                      }}
                      {...rest}
                    />
                  );
                }}
              />
            </ContentItem>
            {traitEntities.map((traitEntity, index) => (
              <ContentItem
                key={traitEntity.id}
                display="flex"
                flexDirection="row"
                maxWidth="50%"
                gap={2}
              >
                <Controller
                  name={`traitEntities.${index}`}
                  rules={{ required: true }}
                  control={control}
                  render={({ field }) => {
                    const { onChange: _, value, ...rest } = field;
                    const options = (
                      allTraitEntities.get(traitEntity.entity)?.values || []
                    ).map((v) => getNlpValueFromCache(v)!);

                    return (
                      <>
                        <AutoCompleteSelect<INlpValue, "value", false>
                          fullWidth={true}
                          options={options}
                          idKey="value"
                          labelKey="value"
                          label={value.entity}
                          multiple={false}
                          value={value.value}
                          onChange={(_e, selected, ..._) => {
                            updateTraitEntity(index, {
                              entity: value.entity,
                              value: selected?.value || "",
                            });
                          }}
                          {...rest}
                        />
                        {value?.confidence &&
                          typeof value?.confidence === "number" && (
                            <Chip
                              sx={{ marginTop: 0.5 }}
                              variant="available"
                              label={`${(value?.confidence * 100).toFixed(
                                2,
                              )}% ${t("label.confidence")}`}
                            />
                          )}
                      </>
                    );
                  }}
                />
              </ContentItem>
            ))}
          </Box>
          <Box display="flex" flexDirection="column">
            {keywordEntities.map((keywordEntity, index) => (
              <ContentItem
                key={keywordEntity.id}
                display="flex"
                maxWidth="50%"
                gap={2}
              >
                <IconButton onClick={() => removeKeywordEntity(index)}>
                  <DeleteIcon />
                </IconButton>
                <Controller
                  name={`keywordEntities.${index}.entity`}
                  control={control}
                  render={({ field }) => {
                    const { onChange: _, ...rest } = field;
                    const options = [...allKeywordEntities.values()];

                    return (
                      <AutoCompleteSelect<INlpEntity, "name", false>
                        fullWidth={true}
                        options={options}
                        idKey="name"
                        labelKey="name"
                        label={t("label.nlp_entity")}
                        multiple={false}
                        onChange={(_e, selected, ..._) => {
                          updateKeywordEntity(index, {
                            ...keywordEntities[index],
                            entity: selected?.name || "",
                          });
                        }}
                        {...rest}
                      />
                    );
                  }}
                />
                <Controller
                  name={`keywordEntities.${index}.value`}
                  control={control}
                  render={({ field }) => {
                    const { onChange: _, value, ...rest } = field;
                    const options = (
                      allKeywordEntities.get(keywordEntity.entity)?.values || []
                    ).map((v) => getNlpValueFromCache(v)!);

                    return (
                      <AutoCompleteSelect<
                        INlpValue,
                        "value",
                        false,
                        false,
                        true
                      >
                        sx={{ width: "50%" }}
                        idKey="value"
                        labelKey="value"
                        label={t("label.value")}
                        multiple={false}
                        options={options}
                        value={value}
                        freeSolo={true}
                        getOptionLabel={(option) => {
                          return typeof option === "string"
                            ? option
                            : option.value;
                        }}
                        onChange={(_e, selected, ..._) => {
                          selected &&
                            updateKeywordEntity(index, {
                              ...keywordEntity,
                              value:
                                typeof selected === "string"
                                  ? selected
                                  : selected.value,
                            });
                        }}
                        {...rest}
                      />
                    );
                  }}
                />
              </ContentItem>
            ))}
          </Box>
        </ContentContainer>
        <ContentItem display="flex" justifyContent="space-between">
          {nlpDatasetSample ? null : (
            <>
              <Button {...cancelButtonProps}>
                {!selection?.value
                  ? t("button.select_some_text")
                  : t("button.add_nlp_entity", { 0: selection.value })}
              </Button>
              <Button {...confirmButtonProps}>{t("button.validate")}</Button>
            </>
          )}
        </ContentItem>
      </form>
    </Wrapper>
  );
};
