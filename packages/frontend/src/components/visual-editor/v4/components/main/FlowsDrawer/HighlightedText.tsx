/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FlowSeachResultHighlightMark } from "./styles";
import { buildHighlightSegments } from "./utils";

type HighlightedTextProps = {
  text: string;
  matches: number[];
};

export const HighlightedText = ({ text, matches }: HighlightedTextProps) => {
  const segments = buildHighlightSegments(text, matches);

  return (
    <>
      {segments.map((segment, index) =>
        segment.highlight ? (
          <FlowSeachResultHighlightMark key={`highlight-${index}`}>
            {segment.text}
          </FlowSeachResultHighlightMark>
        ) : (
          <span key={`text-${index}`}>{segment.text}</span>
        ),
      )}
    </>
  );
};
