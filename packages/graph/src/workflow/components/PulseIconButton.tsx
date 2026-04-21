/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { ButtonHTMLAttributes, CSSProperties } from "react";

type PulseIconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "size"
> & {
  size?: number;
};

export const PulseIconButton = ({
  size = 64,
  className,
  type = "button",
  style,
  ...props
}: PulseIconButtonProps) => {
  return (
    <button
      {...props}
      type={type}
      className={`workflow-pulse-icon-button${className ? ` ${className}` : ""}`}
      style={
        {
          ...style,
          "--workflow-pulse-size": `${size}px`,
        } as CSSProperties
      }
    />
  );
};
