/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IconButton, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { DrawerHeader } from "./styles";

type FlowsDrawerHeaderProps = {
  open: boolean;
  title: string;
  onToggle: () => void;
};

export const FlowsDrawerHeader = ({
  open,
  title,
  onToggle,
}: FlowsDrawerHeaderProps) => (
  <DrawerHeader>
    {open && (
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
    )}
    <IconButton size="small" onClick={onToggle}>
      {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </IconButton>
  </DrawerHeader>
);
