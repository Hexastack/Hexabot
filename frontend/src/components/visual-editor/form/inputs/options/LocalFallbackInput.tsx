/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import MultipleInput from "@/app-components/inputs/MultipleInput";
import { useTranslate } from "@/hooks/useTranslate";
import { BlockFallbackOptions, IBlockAttributes } from "@/types/block.types";

type LocalFallbackProps = {
  value?: BlockFallbackOptions;
  onChange: (options: BlockFallbackOptions) => void;
};

const LocalFallbackInput: FC<LocalFallbackProps> = ({ value, onChange }) => {
  const [fallback, setFallback] = useState<BlockFallbackOptions>(
    value || {
      active: false,
      max_attempts: 0,
      message: [""],
    },
  );
  const { t } = useTranslate();
  const {
    register,
    formState: { errors },
  } = useFormContext<IBlockAttributes>();

  useEffect(() => {
    onChange(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallback]);

  return (
    <Accordion defaultExpanded={fallback?.max_attempts > 0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <CheckCircleIcon
          color={fallback?.max_attempts > 0 ? "success" : "disabled"}
          sx={{ marginRight: ".5rem" }}
        />
        {t("label.enable_fallback")}
      </AccordionSummary>
      <AccordionDetails sx={{ display: "flex", flexDirection: "column" }}>
        <ContentContainer>
          <ContentItem>
            <Input
              fullWidth={false}
              defaultValue={fallback?.max_attempts || 0}
              label={t("label.max_fallback_attempts")}
              type="number"
              inputProps={{
                min: 0,
                maxLength: 13,
                step: "1",
              }}
              {...register("options.fallback.max_attempts", {
                validate: {
                  min: (value) =>
                    value >= 0 ||
                    t("message.invalid_max_fallback_attempt_limit"),
                },
                valueAsNumber: true,
              })}
              helperText={
                errors.options?.fallback?.max_attempts
                  ? errors.options?.fallback?.max_attempts.message
                  : null
              }
              error={!!errors.options?.fallback?.max_attempts}
              onChange={(e) => {
                setFallback({
                  ...fallback,
                  max_attempts: parseInt(e.target.value) || 0,
                  active: parseInt(e.target.value, 10) > 0,
                });
              }}
            />
          </ContentItem>
          <ContentItem>
            <MultipleInput
              label={t("label.message")}
              disabled={fallback.max_attempts === 0}
              value={fallback.message}
              multiline={true}
              minInput={1}
              minRows={3}
              error={!!errors.options?.fallback}
              helperText={errors.options?.fallback?.message as string}
              onChange={(message) => {
                setFallback({
                  ...fallback,
                  message,
                });
              }}
            />
          </ContentItem>
        </ContentContainer>
      </AccordionDetails>
    </Accordion>
  );
};

export default LocalFallbackInput;
