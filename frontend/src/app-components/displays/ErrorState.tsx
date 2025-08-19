/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import ErrorIcon from "@mui/icons-material/Error";
import { Box, Button, Typography } from "@mui/material";
import React from "react";

export interface ErrorStateProps {
  /** The error message to display */
  message?: string;
  /** Optional action function to call when CTA button is clicked */
  action?: () => void;
  /** Custom text for the call-to-action button */
  ctaText?: string;
  /** Whether to show the CTA button */
  showCta?: boolean;
  /** Custom icon size */
  iconSize?: number;
  /** Additional CSS classes or styles */
  className?: string;
  /** Additional CSS styles */
  sx?: any;
}

/**
 * Generic error state component that can be reused across the application
 * to display error states with optional call-to-action functionality.
 *
 * The component is designed to be vertically centered within its parent container
 * using flexbox. The parent should have a defined height for optimal centering.
 *
 * @example
 * // Basic error state
 * <ErrorState message="Something went wrong" />
 *
 * @example
 * // With custom action
 * <ErrorState
 *   message="Failed to load data"
 *   action={() => fetchData()}
 *   ctaText="Reload"
 * />
 *
 * @example
 * // Without CTA button
 * <ErrorState
 *   message="Permission denied"
 *   showCta={false}
 * />
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "An error occurred. Please try again.",
  action,
  ctaText = "Try Again",
  showCta = true,
  iconSize = 48,
  className,
  sx,
}) => {
  const handleAction = () => {
    if (action) {
      action();
    }
  };

  return (
    <Box
      p={2}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      flex={1}
      gap={2}
      className={className}
      sx={sx}
    >
      <ErrorIcon color="error" sx={{ fontSize: iconSize }} />
      <Typography variant="body2" color="error" textAlign="center">
        {message}
      </Typography>
      {showCta && action && (
        <Button
          variant="outlined"
          size="small"
          onClick={handleAction}
          color="error"
        >
          {ctaText}
        </Button>
      )}
    </Box>
  );
};

export default ErrorState;
