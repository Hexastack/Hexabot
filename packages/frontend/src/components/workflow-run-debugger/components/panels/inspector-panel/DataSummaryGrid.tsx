/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SummaryGrid } from "./SummaryGrid";
import { SummaryItem } from "./SummaryItem";

type DataSummaryGridProps = {
  inputLabel: string;
  contextLabel: string;
  outputLabel: string;
  inputSummary: string;
  contextSummary: string;
  outputSummary: string;
};

export const DataSummaryGrid = ({
  inputLabel,
  contextLabel,
  outputLabel,
  inputSummary,
  contextSummary,
  outputSummary,
}: DataSummaryGridProps) => (
  <SummaryGrid
    columns={{
      xs: "1fr",
      sm: "repeat(3, minmax(0, 1fr))",
    }}
  >
    <SummaryItem label={inputLabel} value={inputSummary} />
    <SummaryItem label={contextLabel} value={contextSummary} />
    <SummaryItem label={outputLabel} value={outputSummary} />
  </SummaryGrid>
);
