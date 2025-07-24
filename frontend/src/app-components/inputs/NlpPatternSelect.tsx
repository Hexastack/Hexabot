/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Cancel } from "@mui/icons-material";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import Autocomplete, { AutocompleteProps } from "@mui/material/Autocomplete";
import { forwardRef, SyntheticEvent, useRef } from "react";

import { Input } from "@/app-components/inputs/Input";
import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useSearch } from "@/hooks/useSearch";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { NlpPattern } from "@/types/block.types";
import { INlpEntity } from "@/types/nlp-entity.types";
import { INlpValue } from "@/types/nlp-value.types";

interface NlpPatternSelectProps
  extends Omit<
    AutocompleteProps<INlpEntity, true, true, false>,
    | "onChange"
    | "value"
    | "options"
    | "multiple"
    | "disabled"
    | "renderTags"
    | "renderOptions"
    | "renderInput"
  > {
  patterns: NlpPattern[];
  onChange: (patterns: NlpPattern[]) => void;
  noneLabel?: string;
}

const NlpPatternSelect = (
  { patterns, onChange, noneLabel = "", ...props }: NlpPatternSelectProps,
  ref,
) => {
  const inputRef = useRef(null);
  const theme = useTheme();
  const { t } = useTranslate();
  const { searchPayload } = useSearch<EntityType.NLP_ENTITY>({
    $iLike: ["name"],
  });
  const { data: options, isLoading } = useFind(
    { entity: EntityType.NLP_ENTITY, format: Format.FULL },
    { hasCount: false, params: searchPayload },
  );
  const getNlpValueFromCache = useGetFromCache(EntityType.NLP_VALUE);
  const handleNlpEntityChange = (
    _event: SyntheticEvent<Element, Event>,
    entities: INlpEntity[],
  ): void => {
    const intersection = patterns.filter(({ entity: entityName }) =>
      entities.find(({ name }) => name === entityName),
    );
    const additions = entities.filter(
      ({ name }) =>
        !patterns.find(({ entity: entityName }) => name === entityName),
    );
    const newSelection = [
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

    onChange(newSelection);
  };
  const handleNlpValueChange = (
    { id, name }: Pick<INlpEntity, "id" | "name">,
    valueId: string,
  ): void => {
    const newSelection = patterns.slice(0);
    const idx = newSelection.findIndex(({ entity: e }) => e === name);

    if (idx === -1) {
      throw new Error("Unable to find nlp entity");
    }

    if (valueId === id) {
      newSelection[idx] = {
        entity: newSelection[idx].entity,
        match: "entity",
      };
    } else {
      const value = getNlpValueFromCache(valueId);

      if (!value) {
        throw new Error("Unable to find nlp value in cache");
      }

      newSelection[idx] = {
        entity: newSelection[idx].entity,
        match: "value",
        value: value.value,
      };
    }

    onChange(newSelection);
  };

  if (!options.length) {
    return (
      <Skeleton animation="wave" variant="rounded" width="100%" height={56} />
    );
  }

  const defaultValue = patterns
    .map(({ entity: entityName }) =>
      options.find(({ name }) => entityName === name),
    )
    .filter(Boolean) as INlpEntity[];

  return (
    <Autocomplete
      ref={ref}
      {...props}
      size="medium"
      disabled={options.length === 0}
      value={defaultValue}
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
              mx: "0.5rem",
            }}
          >
            {entities.map(({ id, name, values }, index) => {
              const { key, onDelete } = getTagProps({ index });
              const nlpValues = values.map((vId) =>
                getNlpValueFromCache(vId),
              ) as INlpValue[];
              const currentPattern = patterns.find((e) => e.entity === name);
              const selectedValue =
                currentPattern?.match === "value" ? currentPattern.value : null;
              const { id: selectedId = id } =
                nlpValues.find(({ value }) => value === selectedValue) || {};

              return (
                <Autocomplete
                  size="small"
                  value={selectedId}
                  options={[id].concat(values)}
                  multiple={false}
                  key={key}
                  getOptionLabel={(option) => {
                    const nlpValueCache = getNlpValueFromCache(option);

                    if (nlpValueCache) {
                      return nlpValueCache?.value;
                    }

                    if (option === id) {
                      return `- ${noneLabel || t("label.any")} -`;
                    }

                    return option;
                  }}
                  freeSolo={false}
                  disableClearable
                  popupIcon={false}
                  onChange={(e, valueId) =>
                    handleNlpValueChange({ id, name }, valueId)
                  }
                  sx={{
                    minWidth: 50,
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
                  renderInput={(props) => (
                    <Input
                      {...props}
                      InputProps={{
                        ...props.InputProps,
                        readOnly: true,
                        sx: {
                          padding: 0,
                          overflow: "hidden",
                          cursor: "pointer",
                          fontSize: "14px",
                        },
                        startAdornment: (
                          <InputAdornment position="start">
                            <Chip
                              sx={{
                                p: "0 0.3rem",
                                border: "none",
                                borderRadius: 0,
                              }}
                              color="primary"
                              label={name}
                              variant="role"
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            {isLoading ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : (
                              <IconButton
                                sx={{ p: 0, pr: "2px" }}
                                onClick={(e) => {
                                  onDelete(e);

                                  onChange(
                                    patterns.filter((p) => p.entity !== name),
                                  );
                                }}
                                edge="end"
                                size="small"
                              >
                                <Cancel
                                  sx={{
                                    fontSize: "16px",
                                    transition: ".05s",
                                    "&:hover": {
                                      color: theme.palette.grey[700],
                                    },
                                  }}
                                  htmlColor={theme.palette.grey[500]}
                                />
                              </IconButton>
                            )}
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              );
            })}
          </Box>
        );
      }}
      renderInput={(props) => (
        <Input
          {...props}
          sx={{
            "& .MuiOutlinedInput-root": {
              paddingRight: "6px !important",
            },
          }}
          size="small"
          label={t("label.nlp")}
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
