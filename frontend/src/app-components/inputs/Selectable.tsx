/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Box, CircularProgress, Input, styled } from "@mui/material";
import randomSeed from "random-seed";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { INlpDatasetKeywordEntity } from "../../types/nlp-sample.types";

const SelectableBox = styled(Box)({
  position: "relative",
  height: "30px",
  marginBottom: "1rem",
  "& .highlight, & .editable": {
    position: "absolute",
    top: 0,
    display: "block",
    width: "100%",
    padding: "4px",
  },
  "& .editable": {
    backgroundColor: "transparent",
    padding: "0px 4px",
    color: "#000",
  },
});
const COLORS = [
  { name: "blue", bg: "#108AA8" },
  { name: "navy", bg: "#216372" },
  { name: "lime", bg: "#c6e01a" },
  { name: "teal", bg: "#4BA49C" },
  { name: "olive", bg: "#A8BA33" },
  { name: "fuchsia", bg: "#A80551" },
  { name: "purple", bg: "#570063" },
  { name: "orange", bg: "#E6A23C" },
];
const UNKNOWN_COLOR = { name: "grey", bg: "#aaaaaa" };
const TODAY = new Date().toDateString();
const getColor = (no: number) => {
  const rand = randomSeed.create(TODAY);
  const startIndex = rand(COLORS.length);
  const color =
    no < 0 ? UNKNOWN_COLOR : COLORS[(startIndex + no) % COLORS.length];

  return {
    backgroundColor: color.bg,
    opacity: 0.3,
  };
};

type SelectableProps = {
  defaultValue?: string;
  entities?: INlpDatasetKeywordEntity[];
  placeholder?: string;
  onSelect: (str: string, start: number, end: number) => void;
  onChange: (sample: {
    text: string;
    entities: INlpDatasetKeywordEntity[];
  }) => void;
  loading?: boolean;
};

const Selectable: FC<SelectableProps> = ({
  defaultValue,
  entities = [],
  placeholder = "",
  onChange,
  onSelect,
  loading = false,
}) => {
  const [text, setText] = useState(defaultValue || "");
  const editableRef = useRef<HTMLDivElement>(null);
  const selectableRef = useRef(null);
  const selectedEntities = useMemo(
    () =>
      entities?.map((e, index) => {
        const start = e.start ? e.start : text.indexOf(e.value);
        const end = e.end ? e.end : start + e.value.length;

        return {
          start: text.substring(0, start),
          value: text.substring(start, end),
          end: text.substring(end),
          style: getColor(e.entity ? index : -1),
        };
      }),
    [entities, text],
  );

  useEffect(() => {
    setText(defaultValue || "");
  }, [defaultValue]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();

      if (
        selection &&
        selection.anchorNode &&
        selection.anchorNode === editableRef.current
      ) {
        const inputContainer = editableRef.current;
        let substring: string = "";
        let input: HTMLInputElement | null = null;

        if (inputContainer) {
          input = inputContainer.querySelector("input");

          if (
            input &&
            input.selectionStart !== null &&
            input.selectionStart >= 0 &&
            input.selectionEnd &&
            input.selectionStart !== input.selectionEnd
          ) {
            substring = text.substring(
              input.selectionStart,
              input.selectionEnd,
            );
          }
        }
        onSelect(
          substring,
          input?.selectionStart ?? 0,
          input?.selectionEnd ?? 0,
        );
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [text, onSelect]);

  const handleTextChange = useCallback(
    (newText: string) => {
      const oldText = text;
      const oldEntities = [...entities];
      const newEntities: INlpDatasetKeywordEntity[] = [];
      const findCharDiff = (oldStr: string, newStr: string): number => {
        const minLength = Math.min(oldStr.length, newStr.length);
        const diffIndex = [...Array(minLength)].findIndex(
          (_, i) => oldStr[i] !== newStr[i],
        );

        return diffIndex === -1 ? minLength : diffIndex;
      };
      const changePoint = findCharDiff(oldText, newText);
      const textLengthDifference = newText.length - oldText.length;

      oldEntities.forEach((oldEntity) => {
        let newStart = oldEntity.start;
        let newEnd = oldEntity.end;

        if (changePoint <= oldEntity.start) {
          newStart += textLengthDifference;
          newEnd += textLengthDifference;
        }

        if (newStart >= 0 && newEnd <= newText.length) {
          const oldEntityText = oldText.substring(
            oldEntity.start,
            oldEntity.end,
          );
          const newEntityText = newText.substring(newStart, newEnd);

          if (oldEntityText === newEntityText) {
            newEntities.push({
              ...oldEntity,
              start: newStart,
              end: newEnd,
            });
          }
        }
      });

      // Update parent component or manage state locally
      setText(newText);

      onChange({ text: newText, entities: newEntities });
    },
    [text, onChange, entities],
  );

  return (
    <SelectableBox ref={selectableRef}>
      {selectedEntities?.map((e, idx) => (
        <div key={idx} className="highlight">
          <span>{e.start}</span>
          <span style={e.style}>{e.value}</span>
          <span>{e.end}</span>
        </div>
      ))}
      <Input
        ref={editableRef}
        className="editable"
        fullWidth
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        endAdornment={
          loading ? (
            <CircularProgress
              size={20}
              style={{
                position: "absolute",
                right: 0,
                top: "20%",
                transform: "translateY(-20%)",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderRadius: "50%",
              }}
              aria-label="Loading..."
            />
          ) : null
        }
      />
    </SelectableBox>
  );
};

Selectable.displayName = "Selectable";

export default Selectable;
