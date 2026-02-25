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

import { getDescription, LabelWithTooltip } from "../widgets/shared";

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
      <Grid container spacing={2} style={{ marginTop: "10px" }}>
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
        {properties.map((element, index) =>
          element.hidden ? (
            element.content
          ) : (
            <Grid
              size={{ xs: 12 }}
              style={{ marginBottom: "10px" }}
              key={index}
            >
              {element.content}
            </Grid>
          ),
        )}
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
      <AccordionSummary>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
        >
          <Typography variant="subtitle2">{label}</Typography>
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
