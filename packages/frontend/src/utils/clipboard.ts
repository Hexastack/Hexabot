/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

const copyWithTextArea = (text: string) => {
  const textArea = document.createElement("textarea");

  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.left = "-9999px";
  textArea.style.position = "fixed";
  document.body.appendChild(textArea);
  textArea.select();

  try {
    const wasCopied = document.execCommand("copy");

    if (!wasCopied) {
      throw new Error("Unable to copy text");
    }
  } finally {
    document.body.removeChild(textArea);
  }
};

export const writeToClipboard = async (text: string) => {
  if (!navigator.clipboard?.writeText) {
    copyWithTextArea(text);

    return;
  }

  try {
    await navigator.clipboard.writeText(text);

    return;
  } catch {
    copyWithTextArea(text);
  }
};
