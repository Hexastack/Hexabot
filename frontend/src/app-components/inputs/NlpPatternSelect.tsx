/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Cancel } from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { forwardRef, SyntheticEvent, useRef, useState } from "react";

import { Input } from "@/app-components/inputs/Input";
import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useSearch } from "@/hooks/useSearch";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { NlpPattern } from "@/types/block.types";
import { INlpEntity } from "@/types/nlp-entity.types";
import { INlpValue } from "@/types/nlp-value.types";

type NlpPatternSelectProps = { patterns: NlpPattern[]; onChange: any };

const NlpPatternSelect = (
  { patterns, onChange }: NlpPatternSelectProps,
  ref,
) => {
  const inputRef = useRef(null);
  const [selected, setSelected] = useState<NlpPattern[]>(patterns);
  const theme = useTheme();
  const { t } = useTranslate();
  const { onSearch, searchPayload } = useSearch<INlpEntity>({
    $iLike: ["name"],
  });
  const { data: options, isLoading } = useFind(
    { entity: EntityType.NLP_ENTITY, format: Format.FULL },
    { hasCount: false, params: searchPayload },
  );
  const getNlpValueFromCache = useGetFromCache(EntityType.NLP_VALUE);

  function handleNlpEntityChange(
    _event: SyntheticEvent<Element, Event>,
    entities: INlpEntity[],
  ): void {
    const intersection = selected.filter(({ entity: entityName }) =>
      entities.find(({ name }) => name === entityName),
    );
    const additions = entities.filter(
      ({ name }) =>
        !selected.find(({ entity: entityName }) => name === entityName),
    );
    const newSelection: NlpPattern[] = [
      ...intersection,
      ...additions.map(
        ({ name }) =>
          ({
            entity: name,
            match: "entity",
            value: name,
          } as NlpPattern),
      ),
    ];

    setSelected(newSelection);
  }

  const handleNlpValueChange = (entity: INlpEntity, valueId: string) => {
    const newSelection = [...selected];
    const update = newSelection.find(({ entity: e }) => e === entity.name);

    if (!update) {
      throw new Error("Unable to find nlp entity");
    }

    if (valueId === entity.id) {
      update.match = "entity";
      update.value = entity.name;
    } else {
      const value = getNlpValueFromCache(valueId);

      if (!value) {
        throw new Error("Unable to find nlp value in cache");
      }
      update.match = "value";
      update.value = value.value;
    }

    onChange(undefined, newSelection);
  };

  if (!options.length) {
    return (
      <Skeleton animation="wave" variant="rounded" width="100%" height={56} />
    );
  }

  const defaultValue =
    options.filter(({ name }) =>
      selected.find(({ entity: entityName }) => entityName === name),
    ) || {};

  return (
    <Autocomplete
      ref={ref}
      size="medium"
      disabled={options.length === 0}
      defaultValue={defaultValue}
      multiple={true}
      options={options}
      onChange={handleNlpEntityChange}
      renderOption={(props, { name, doc }, { selected }) => (
        <Box
          component="li"
          {...props}
          p={2}
          display="flex"
          flexDirection="column"
          style={{
            alignItems: "start",
          }}
          sx={{
            backgroundColor: selected
              ? theme.palette.action.selected
              : "inherit",
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
            cursor: "pointer",
          }}
        >
          <Typography variant="body1" fontWeight="bold">
            {name}
          </Typography>
          {doc && (
            <Typography variant="body2" color="textSecondary">
              {doc}
            </Typography>
          )}
        </Box>
      )}
      getOptionLabel={({ name }) => name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      freeSolo={false}
      loading={isLoading}
      renderTags={(entities, getTagProps) => {
        return (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.5,
            }}
          >
            {entities.map((entity, index) => {
              const { key, onDelete } = getTagProps({ index });
              const handleChange = (
                _event: SyntheticEvent<Element, Event>,
                valueId: string,
              ) => {
                handleNlpValueChange(entity, valueId);
              };
              const values = entity.values.map((vId) =>
                getNlpValueFromCache(vId),
              ) as INlpValue[];
              const selectedValue = patterns?.find(
                (e) => e.entity === entity.name,
              )?.value;
              const value = values.find(({ value }) => value === selectedValue);

              return (
                <Autocomplete
                  size="small"
                  defaultValue={value?.id || entity.id}
                  options={[entity.id].concat(entity.values)}
                  multiple={false}
                  key={key}
                  getOptionLabel={(option) => {
                    const nlpValueCache = getNlpValueFromCache(option);

                    if (nlpValueCache) {
                      return nlpValueCache?.value;
                    }

                    if (option === entity.id) {
                      return t("label.any");
                    }

                    return option;
                  }}
                  freeSolo={false}
                  disableClearable
                  popupIcon={false}
                  onChange={handleChange}
                  sx={{
                    minWidth: 50,
                    padding: 0,
                    ".MuiAutocomplete-input": {
                      minWidth: "100px !important",
                    },
                    "& .MuiOutlinedInput-root": {
                      paddingRight: "2rem !important",
                      "&.MuiInputBase-sizeSmall": {
                        padding: "0 6px 0 0 !important",
                      },
                    },
                  }}
                  renderInput={(props) => {
                    return (
                      <Input
                        {...props}
                        InputProps={{
                          ...props.InputProps,
                          readOnly: true,
                          sx: {
                            padding: 0,
                            overflow: "hidden",
                            cursor: "pointer",
                          },
                          startAdornment: (
                            <InputAdornment
                              position="start"
                              sx={{
                                padding: "0 1rem",
                                height: "100%",
                                backgroundColor: theme.palette.grey[200],
                              }}
                            >
                              {entity.name}
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              {isLoading ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : (
                                <IconButton
                                  sx={{ padding: 0 }}
                                  onClick={(e) => {
                                    onDelete(e);

                                    onChange(
                                      undefined,
                                      patterns.filter(
                                        (p) => p.entity !== entity.name,
                                      ),
                                    );
                                  }}
                                  edge="end"
                                  size="small"
                                >
                                  <Cancel htmlColor={theme.palette.grey[500]} />
                                </IconButton>
                              )}
                            </InputAdornment>
                          ),
                        }}
                      />
                    );
                  }}
                />
              );
            })}
          </Box>
        );
      }}
      renderInput={(props) => (
        <Input
          {...props}
          label={t("label.nlp")}
          onChange={(e) => onSearch(e.target.value)}
          InputProps={{
            ...props.InputProps,
            inputRef,
            onClick: (event) => {
              if (event.target !== inputRef.current) {
                event.stopPropagation();
                event.preventDefault();
              }
            },
            endAdornment: isLoading ? (
              <CircularProgress color="inherit" size={20} />
            ) : null,
          }}
        />
      )}
    />
  );
};

NlpPatternSelect.displayName = "NlpPatternSelect";

export default forwardRef(NlpPatternSelect) as (
  props: NlpPatternSelectProps & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  },
) => ReturnType<typeof NlpPatternSelect>;
