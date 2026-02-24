/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Collapse,
  Grid,
  Typography,
} from "@mui/material";
import {
  buttonId,
  canExpand,
  descriptionId,
  getTemplate,
  getUiOptions,
  titleId,
  type ObjectFieldTemplateProps,
  type RJSFSchema,
} from "@rjsf/utils";
import { ChevronDown } from "lucide-react";

import { getDescription, LabelWithTooltip } from "../widgets/shared";

type AnimatedVisibilityUiOptions = {
  controllerField: string;
  detailFields: string[];
  expandedValue: unknown;
  transitionMs: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const getAnimatedVisibilityOptions = (
  uiOptions: Record<string, unknown>,
): AnimatedVisibilityUiOptions | undefined => {
  const animatedVisibility = uiOptions.animatedVisibility;

  if (!isRecord(animatedVisibility)) {
    return undefined;
  }

  const controllerField =
    typeof animatedVisibility.controllerField === "string" &&
    animatedVisibility.controllerField.length > 0
      ? animatedVisibility.controllerField
      : "enabled";
  const detailFields = Array.isArray(animatedVisibility.detailFields)
    ? animatedVisibility.detailFields.filter(
        (field): field is string =>
          typeof field === "string" && field.length > 0,
      )
    : [];

  if (detailFields.length === 0) {
    return undefined;
  }

  const transitionMs =
    typeof animatedVisibility.transitionMs === "number" &&
    Number.isFinite(animatedVisibility.transitionMs)
      ? animatedVisibility.transitionMs
      : 250;

  return {
    controllerField,
    detailFields,
    expandedValue:
      "expandedValue" in animatedVisibility
        ? animatedVisibility.expandedValue
        : true,
    transitionMs,
  };
};

export const ActionObjectFieldTemplate = (props: ObjectFieldTemplateProps) => {
  const {
    description,
    title,
    properties,
    required,
    disabled,
    readonly,
    uiSchema,
    fieldPathId,
    schema,
    formData,
    optionalDataControl,
    onAddProperty,
    registry,
  } = props;
  const uiOptions = getUiOptions(uiSchema, registry.globalUiOptions);
  const animatedVisibilityOptions = getAnimatedVisibilityOptions(
    uiOptions as Record<string, unknown>,
  );
  const detailFieldSet = animatedVisibilityOptions
    ? new Set(animatedVisibilityOptions.detailFields)
    : undefined;
  const detailsExpanded =
    animatedVisibilityOptions && isRecord(formData)
      ? formData[animatedVisibilityOptions.controllerField] ===
        animatedVisibilityOptions.expandedValue
      : false;
  const collapsible = uiOptions?.collapsible === true;
  const defaultExpanded = uiOptions?.defaultExpanded === true;
  const TitleFieldTemplate = getTemplate(
    "TitleFieldTemplate",
    registry,
    uiOptions,
  );
  const DescriptionFieldTemplate = getTemplate(
    "DescriptionFieldTemplate",
    registry,
    uiOptions,
  );
  const showOptionalDataControlInTitle = !readonly && !disabled;
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const descriptionText = getDescription(schema as RJSFSchema, uiOptions);
  const titleLabel = uiOptions?.title ?? title;
  const label = (
    <LabelWithTooltip
      label={titleLabel}
      description={descriptionText}
      iconSize={16}
    />
  );
  const propertiesContent = (
    <>
      {description ? (
        <DescriptionFieldTemplate
          id={descriptionId(fieldPathId)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      ) : null}
      <Grid container spacing={0.5}>
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
        {properties.map((element, index) => {
          if (element.hidden) {
            return element.content;
          }

          const isAnimatedDetailField =
            detailFieldSet?.has(element.name) === true;

          if (!isAnimatedDetailField || !animatedVisibilityOptions) {
            return (
              <Grid
                size={{ xs: 12 }}
                style={{ marginBottom: ".5rem" }}
                key={index}
              >
                {element.content}
              </Grid>
            );
          }

          return (
            <Grid
              size={{ xs: 12 }}
              style={{
                marginBottom: detailsExpanded ? ".5rem" : 0,
                paddingTop: detailsExpanded ? undefined : 0,
                paddingBottom: detailsExpanded ? undefined : 0,
              }}
              key={index}
            >
              <Collapse
                in={detailsExpanded}
                timeout={animatedVisibilityOptions.transitionMs}
                unmountOnExit
              >
                {element.content}
              </Collapse>
            </Grid>
          );
        })}
      </Grid>
      {canExpand(schema, uiSchema, formData) ? (
        <Grid container justifyContent="flex-end">
          <Grid>
            <AddButton
              id={buttonId(fieldPathId, "add")}
              className="rjsf-object-property-expand"
              onClick={onAddProperty}
              disabled={disabled || readonly}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Grid>
        </Grid>
      ) : null}
    </>
  );

  if (!collapsible) {
    return (
      <>
        {titleLabel ? (
          <TitleFieldTemplate
            id={titleId(fieldPathId)}
            title={titleLabel}
            required={required}
            schema={schema}
            uiSchema={uiSchema}
            registry={registry}
            optionalDataControl={
              showOptionalDataControlInTitle ? optionalDataControl : undefined
            }
          />
        ) : null}
        {propertiesContent}
      </>
    );
  }

  return (
    <Accordion variant="elevation" defaultExpanded={defaultExpanded}>
      <AccordionSummary expandIcon={<ChevronDown size={16} />}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
        >
          <Typography variant="subtitle1">{label}</Typography>
          {showOptionalDataControlInTitle ? (
            <Box onClick={(event) => event.stopPropagation()}>
              {optionalDataControl}
            </Box>
          ) : null}
        </Box>
      </AccordionSummary>
      <AccordionDetails>{propertiesContent}</AccordionDetails>
    </Accordion>
  );
};
