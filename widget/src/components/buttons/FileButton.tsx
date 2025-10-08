/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React, { ChangeEvent, useMemo } from "react";

import { useChat } from "../../providers/ChatProvider";
import { MIME_TYPES } from "../../utils/attachment";
import FileInputIcon from "../icons/FileInputIcon";

import "./FileButton.scss";

const FileButton: React.FC = () => {
  const { setFile } = useChat();
  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).value = "";
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
    <div className="sc-user-input--file-wrapper">
      <button className="sc-user-input--file-icon-wrapper" type="button">
        <FileInputIcon />
        <input
          accept={acceptedMimeTypes}
          type="file"
          id="file-input"
          onChange={handleChange}
          onClick={handleClick}
        />
      </button>
    </div>
  );
};

export default FileButton;
