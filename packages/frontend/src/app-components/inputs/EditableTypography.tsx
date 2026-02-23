/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import EditOutlined from "@mui/icons-material/EditOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { TypographyProps } from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import {
  forwardRef,
  memo,
  MutableRefObject,
  Ref,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useTranslate } from "@/hooks/useTranslate";

type EditableTypographyProps = Omit<TypographyProps, "children"> & {
  /**
   * Controlled value (optional). If you pass this, you probably want to update it in onCommit.
   */
  value?: string;

  /**
   * Uncontrolled initial value.
   */
  defaultValue?: string;

  /**
   * Called as the user types (does NOT re-render the text while editing).
   * Useful if you want “live” updates elsewhere.
   */
  onChange?: (next: string) => void;

  /**
   * Called when editing finishes (blur or Enter for single-line).
   * This is usually where you set state / save to backend.
   */
  onCommit?: (next: string) => void;

  /**
   * Called when user presses Escape.
   */
  onCancel?: () => void;

  /**
   * Shown when empty and not editing.
   */
  placeholder?: string;

  /**
   * Allow line breaks.
   */
  multiline?: boolean;

  disabled?: boolean;
};

function useForkRef<T>(...refs: Array<Ref<T> | undefined>) {
  return useMemo(
    () => (value: T) => {
      refs.forEach((ref) => {
        if (!ref) return;
        if (typeof ref === "function") ref(value);
        else (ref as MutableRefObject<T | null>).current = value;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs,
  );
}

export const EditableTypography = memo(
  forwardRef<HTMLElement, EditableTypographyProps>(function EditableTypography(
    {
      value: valueProp,
      defaultValue = "",
      onChange,
      onCommit,
      onCancel,
      placeholder,
      multiline = false,
      disabled = false,
      // IMPORTANT: contentEditable only works reliably on native DOM elements.
      // Typography lets you keep the same styles while changing the element via `component`.
      component = "span",
      sx,
      ...typographyProps
    },
    forwardedRef,
  ) {
    const { t } = useTranslate();
    // Typography forwards the ref to the root element. :contentReference[oaicite:1]{index=1}
    const rootRef = useRef<HTMLElement | null>(null);
    const handleRef = useForkRef<HTMLElement>(rootRef, forwardedRef);
    const isControlled = valueProp !== undefined;
    // We keep a "renderValue" so controlled mode can be optimistic (no flicker after commit).
    const [renderValue, setRenderValue] = useState<string>(
      isControlled ? (valueProp as string) : defaultValue,
    );
    const [isEditing, setIsEditing] = useState(false);

    // When not editing, keep renderValue in sync with controlled prop changes.
    useEffect(() => {
      if (!isControlled) return;
      if (isEditing) return;
      setRenderValue(valueProp as string);
    }, [isControlled, valueProp, isEditing]);

    // Snapshot value at the moment editing starts, and keep it stable in render
    // so React won't overwrite user typing (even if parent re-renders).
    const editStartValueRef = useRef<string>(renderValue);
    // Latest typed text (no re-renders on each keystroke).
    const draftRef = useRef<string>(renderValue);
    // Used to avoid blur-commit right after Escape cancel.
    const skipNextBlurCommitRef = useRef(false);
    const startEditing = useCallback(() => {
      if (disabled) return;
      editStartValueRef.current = renderValue;
      draftRef.current = renderValue;
      setIsEditing(true);
    }, [disabled, renderValue]);
    const cancelEditing = useCallback(() => {
      skipNextBlurCommitRef.current = true;
      setIsEditing(false);
      draftRef.current = editStartValueRef.current;
      onCancel?.();
      queueMicrotask(() => {
        skipNextBlurCommitRef.current = false;
      });
    }, [onCancel]);
    const readElementValue = useCallback(
      (el: HTMLElement) =>
        (multiline ? el.innerText : (el.textContent ?? "")).replace(
          /\u00A0/g,
          "",
        ),
      [multiline],
    );
    const commitEditing = useCallback(() => {
      const el = rootRef.current;

      if (!el) return;

      const next = readElementValue(el);

      setIsEditing(false);

      // Optimistic display update (helps controlled mode feel instant)
      setRenderValue(next);
      draftRef.current = next;

      onChange?.(next);
      onCommit?.(next);
    }, [onChange, onCommit, readElementValue]);

    useLayoutEffect(() => {
      if (!isEditing) return;
      const el = rootRef.current;

      if (!el) return;

      // Ensure edit mode starts from the committed value (not placeholder)
      el.textContent = editStartValueRef.current;

      el.focus();

      // Put caret at end
      const selection = window.getSelection();

      if (!selection) return;
      const range = document.createRange();

      range.selectNodeContents(el);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }, [isEditing]);

    const insertTextAtCursor = (text: string) => {
      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0) return;

      selection.deleteFromDocument();
      const range = selection.getRangeAt(0);
      const node = document.createTextNode(text);

      range.insertNode(node);

      // Move caret after inserted text
      range.setStartAfter(node);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    };
    // What React renders as children:
    // - Not editing: the current value (or placeholder)
    // - Editing: the value *as it was when editing started* (stable!)
    const displayText = isEditing
      ? editStartValueRef.current
      : renderValue || placeholder || "";
    const showPlaceholder = !isEditing && !renderValue && !!placeholder;
    const editIconButtonClass = "editable-typography-edit-icon";
    const editLabel = t("button.edit");

    return (
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: multiline ? "flex-start" : "center",
          gap: 0.25,
          width: "100%",
          minWidth: 0,
          [`& .${editIconButtonClass}`]: {
            opacity: 0,
            pointerEvents: "none",
            transition: theme.transitions.create("opacity", {
              duration: theme.transitions.duration.shortest,
            }),
          },
          ...(!disabled && !isEditing
            ? {
                [`&:hover .${editIconButtonClass}, &:focus-within .${editIconButtonClass}`]:
                  {
                    opacity: 1,
                    pointerEvents: "auto",
                  },
              }
            : null),
        })}
      >
        <Typography
          {...typographyProps}
          ref={handleRef}
          component={component as any}
          contentEditable={isEditing && !disabled}
          suppressContentEditableWarning
          tabIndex={disabled ? -1 : 0}
          role="textbox"
          aria-readonly={!isEditing}
          aria-multiline={multiline || undefined}
          aria-disabled={disabled || undefined}
          onClick={(e) => {
            typographyProps.onClick?.(e);
            if (!isEditing) startEditing();
          }}
          onKeyDown={(e) => {
            typographyProps.onKeyDown?.(e);
            if (disabled) return;

            if (!isEditing) {
              if (e.key === "Enter" || e.key === "F2") {
                e.preventDefault();
                startEditing();
              }

              return;
            }

            if (e.key === "Escape") {
              e.preventDefault();
              cancelEditing();

              return;
            }

            if (!multiline && e.key === "Enter") {
              e.preventDefault();
              commitEditing();
              rootRef.current?.blur();
            }
          }}
          onInput={(e) => {
            typographyProps.onInput?.(e);
            const el = rootRef.current;

            if (!el) return;
            draftRef.current = readElementValue(el);
            onChange?.(draftRef.current);
          }}
          onBeforeInput={(e) => {
            // Prevent line breaks in single-line mode (covers IME and mobile keyboards)
            const inputType = e.nativeEvent?.inputType as string | undefined;

            if (
              !multiline &&
              (inputType === "insertParagraph" ||
                inputType === "insertLineBreak")
            ) {
              e.preventDefault();
              commitEditing();
              rootRef.current?.blur();
            }
          }}
          onPaste={(e) => {
            typographyProps.onPaste?.(e);
            if (!isEditing) return;
            e.preventDefault();
            insertTextAtCursor(e.clipboardData.getData("text/plain"));
          }}
          onBlur={(e) => {
            typographyProps.onBlur?.(e);
            if (!isEditing) return;
            if (skipNextBlurCommitRef.current) return;
            commitEditing();
          }}
          p={0.25}
          mx={-0.25}
          sx={{
            flex: 1,
            minWidth: 0,
            cursor: disabled ? "default" : isEditing ? "text" : "pointer",
            userSelect: isEditing ? "text" : "none",
            outline: "none",
            whiteSpace: multiline ? "pre-wrap" : "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            ...(showPlaceholder ? { color: "text.secondary" } : null),
            "&:hover":
              disabled || isEditing
                ? undefined
                : { backgroundColor: "action.hover" },
            "&:focus-visible": disabled
              ? undefined
              : {
                  outline: "1px solid",
                  outlineColor: "primary.main",
                  borderRadius: 0.5,
                },
            ...sx,
          }}
        >
          {displayText}
        </Typography>
        <Tooltip title={editLabel}>
          <span>
            <IconButton
              size="small"
              disabled={disabled}
              aria-label={editLabel}
              className={editIconButtonClass}
              onClick={() => {
                if (!isEditing) startEditing();
              }}
            >
              <EditOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    );
  }),
);
