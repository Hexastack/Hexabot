/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Paperclip } from "lucide-react";
import React, { ChangeEvent, useMemo, useRef } from "react";

import { useChat } from "../../providers/ChatProvider";
import { MIME_TYPES } from "../../utils/attachment";

import "./FileButton.scss";

const FileButton: React.FC = () => {
  const { setFile } = useChat();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openFilePicker = () => {
    if (!fileInputRef.current) return;

    // Reset the current value so selecting the same file triggers `onChange`.
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile && setFile(e.target.files[0]);
    }
  };
  const acceptedMimeTypes = useMemo(
    () => Object.values(MIME_TYPES).flat().join(","),
    [],
  );

  return (
    <div className="hb-user-input--file-wrapper">
      <button
        className="hb-user-input--file-icon-wrapper"
        type="button"
        onClick={openFilePicker}
      >
        <Paperclip className="hb-user-input--file-icon" />
      </button>
      <input
        ref={fileInputRef}
        accept={acceptedMimeTypes}
        type="file"
        id="file-input"
        className="hb-user-input--file-input"
        onChange={handleChange}
      />
    </div>
  );
};

export default FileButton;
