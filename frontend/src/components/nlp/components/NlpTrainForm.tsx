/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import AddIcon from "@mui/icons-material/Add";
import Check from "@mui/icons-material/Check";
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
import { FC, useCallback, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import AutoCompleteSelect from "@/app-components/inputs/AutoCompleteSelect";
import Selectable from "@/app-components/inputs/Selectable";
import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useApiClient } from "@/hooks/useApiClient";
import { EntityType, Format } from "@/services/types";
import { INlpEntity } from "@/types/nlp-entity.types";
import {
  INlpDatasetKeywordEntity,
  INlpDatasetTraitEntity,
  INlpSampleFormAttributes,
  INlpSampleFull,
  NlpSampleType,
} from "@/types/nlp-sample.types";
import { INlpValue } from "@/types/nlp-value.types";

type NlpDatasetSampleProps = {
  sample?: INlpSampleFull;
  submitForm: (params: INlpSampleFormAttributes) => void;
};

const NlpDatasetSample: FC<NlpDatasetSampleProps> = ({
  sample,
  submitForm,
}) => {
  const { t } = useTranslation();
  const { data: entities, refetch: refetchEntities } = useFind(
    {
      entity: EntityType.NLP_ENTITY,
      format: Format.FULL,
    },
    {
      hasCount: false,
    },
    {
      onSuccess(entities) {
        // By default append trait entities
        if (!sample) {
          removeTraitEntity();
          (entities || [])
            .filter(({ lookups }) => lookups.includes("trait"))
            .forEach(({ name }) => {
              appendTraitEntity({
                entity: name,
                value: "",
              });
            });
        }
      },
    },
  );
  const getNlpValueFromCache = useGetFromCache(EntityType.NLP_VALUE);
  // Default trait entities to append to the form
  const defaultTraitEntities = useMemo(() => {
    if (!sample || !entities) return [];

    const traitEntities = entities.filter(({ lookups }) =>
      lookups.includes("trait"),
    );
    const sampleTraitEntities = sample.entities.filter(
      (e) => typeof e.start === "undefined",
    );

    if (sampleTraitEntities.length === traitEntities.length) {
      return sampleTraitEntities;
    }

    const sampleEntityNames = new Set(sampleTraitEntities.map((e) => e.entity));
    const missingEntities = traitEntities
      .filter(({ name }) => !sampleEntityNames.has(name))
      .map(({ name }) => ({
        entity: name,
        value: "",
      }));

    return [...sampleTraitEntities, ...missingEntities];
  }, [entities, sample]);
  const { handleSubmit, control, register, reset, setValue, watch } =
    useForm<INlpSampleFormAttributes>({
      defaultValues: {
        type: sample?.type || NlpSampleType.train,
        text: sample?.text || "",
        traitEntities: defaultTraitEntities,
        keywordEntities:
          sample?.entities.filter((e) => typeof e.start === "number") || [],
      },
    });
  const currentText = watch("text");
  const currentType = watch("type");
  const { apiClient } = useApiClient();
  const {
    fields: traitEntities,
    append: appendTraitEntity,
    update: updateTraitEntity,
    remove: removeTraitEntity,
  } = useFieldArray({
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

  useQuery({
    queryKey: ["nlp-prediction", currentText],
    queryFn: async () => {
      return await apiClient.predictNlp(currentText);
    },
    onSuccess: (result) => {
      const traitEntities: INlpDatasetTraitEntity[] = result.entities.filter(
        (e) => !("start" in e && "end" in e),
      );
      const keywordEntities = result.entities.filter(
        (e) => "start" in e && "end" in e,
      ) as INlpDatasetKeywordEntity[];

      setValue("traitEntities", traitEntities);
      setValue("keywordEntities", keywordEntities);
    },
    enabled: !sample && !!currentText,
  });

  const findInsertIndex = (newItem: INlpDatasetKeywordEntity): number => {
    const index = keywordEntities.findIndex(
      (entity) => entity.start > newItem.start,
    );

    return index === -1 ? keywordEntities.length : index;
  };
  const [selection, setSelection] = useState<{
    value: string;
    start: number;
    end: number;
  } | null>(null);
  const onSubmitForm = (params: INlpSampleFormAttributes) => {
    submitForm(params);
    reset();
    removeTraitEntity();
    removeKeywordEntity();
    refetchEntities();
  };

  return (
    <Box className="nlp-train" sx={{ position: "relative", p: 2 }}>
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
                  sample?.type === NlpSampleType.test
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
              entities={keywordEntities}
              placeholder={t("placeholder.nlp_sample_text")}
              onSelect={(selection, start, end) => {
                setSelection({
                  value: selection,
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
              }}
            />
          </ContentItem>
          <Box display="flex" flexDirection="column">
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
                    const entity = entities?.find(
                      ({ name }) => name === traitEntity.entity,
                    );
                    const options =
                      entity?.values.map(
                        (v) => getNlpValueFromCache(v) as INlpValue,
                      ) || [];

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

                    return (
                      <AutoCompleteEntitySelect<INlpEntity, "name", false>
                        fullWidth={true}
                        searchFields={["name"]}
                        entity={EntityType.NLP_ENTITY}
                        format={Format.FULL}
                        idKey="name"
                        labelKey="name"
                        label={t("label.nlp_entity")}
                        multiple={false}
                        preprocess={(options) => {
                          return options.filter(({ lookups }) =>
                            lookups.includes("keywords"),
                          );
                        }}
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
                    const entity = entities?.find(
                      ({ name }) => name === keywordEntity.entity,
                    );
                    const options =
                      entity?.values.map(
                        (v) => getNlpValueFromCache(v) as INlpValue,
                      ) || [];

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
          <Button
            startIcon={<AddIcon />}
            color="secondary"
            variant="contained"
            disabled={!selection?.value}
            onClick={() => {
              const newKeywordEntity = {
                ...selection,
                entity: "",
              } as INlpDatasetKeywordEntity;
              const newIndex = findInsertIndex(newKeywordEntity);

              selection && insertKeywordEntity(newIndex, newKeywordEntity);
              setSelection(null);
            }}
          >
            {!selection?.value
              ? t("button.select_some_text")
              : t("button.add_nlp_entity", { 0: selection.value })}
          </Button>

          <Button
            variant="contained"
            startIcon={<Check />}
            onClick={handleSubmit(onSubmitForm)}
            disabled={
              !(
                currentText !== "" &&
                currentType !== NlpSampleType.inbox &&
                traitEntities.every((e) => e.value !== "") &&
                keywordEntities.every((e) => e.value !== "")
              )
            }
            type="submit"
          >
            {t("button.validate")}
          </Button>
        </ContentItem>
      </form>
    </Box>
  );
};

NlpDatasetSample.displayName = "NlpTrain";

export default NlpDatasetSample;
