/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import Add from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { Button, Grid, styled, Tab, Tabs, tabsClasses } from "@mui/material";
import { MouseEvent, SyntheticEvent } from "react";

import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

import { useCategories } from "../../hooks/useCategories";
import { useMoveBlocksDialog } from "../../hooks/useMoveBlocksDialog";

const StyledButton = styled(Button)(() => ({
  marginTop: "7px",
  marginLeft: "5px",
  marginRight: "5px",
  borderRadius: "0",
  minHeight: "30px",
  border: "1px solid #DDDDDD",
  backgroundColor: "#F8F8F8",
  borderBottom: "none",
  width: "42px",
  minWidth: "42px",
}));
const StyledGrid = styled(Grid)(() => ({
  display: "flex",
  position: "relative",
  background: "#fff",
  flexDirection: "row",
  borderBottom: "1.5px solid #DDDDDD",
}));
const StyledTabs = styled(Tabs)(() => ({
  backgroundColor: "#fff",
  [`& .${tabsClasses.indicator}`]: {
    display: "none",
  },
  "& .MuiTabs-scrollButtons": {
    opacity: 0.8,
    backgroundColor: "#1ca089",
    borderTop: "1px solid #137261",
    marginTop: "7px",
    color: "#FFF",
    overflow: "visible",
    boxShadow:
      "-20px 0px 20px -20px rgba(0, 0, 0, 0.5), 0px 2px 9px 0px rgba(0, 0, 0, 0.5)",
    zIndex: 10,
    "&:hover": {
      opacity: 1,
    },
  },
}));
const StyledTab = styled(Tab)(() => ({
  marginTop: "7px",
  marginLeft: "5px",
  border: "1px solid #DDDDDD",
  backgroundColor: "#F8F8F8",
  borderBottom: "none",
  minHeight: "30px",
  "&.Mui-selected": {
    backgroundColor: "#EAF1F1",
    zIndex: 1,
    color: "#000",
    backgroundSize: "20px 20px",
    backgroundAttachment: "fixed",
    backgroundPosition: "-1px -1px",
  },
}));

export const FlowsTabs = ({
  onSearchClick,
}: {
  onSearchClick: (e: MouseEvent) => void;
}) => {
  const hasPermission = useHasPermission();
  const dialogs = useDialogs();
  const { t } = useTranslate();
  const { onCategoryChange } = useMoveBlocksDialog();
  const { categories, selectedCategoryIndex } = useCategories();
  const changeHandler = (_event: SyntheticEvent, categoryIndex: number) => {
    onCategoryChange(categoryIndex);
  };

  return (
    <StyledGrid>
      <StyledTabs
        value={selectedCategoryIndex === false ? false : selectedCategoryIndex}
        variant="scrollable"
        onChange={changeHandler}
        allowScrollButtonsMobile
      >
        {categories?.map(({ id, label }) => (
          <StyledTab key={id} label={<Grid>{label}</Grid>} />
        ))}
      </StyledTabs>
      {hasPermission(EntityType.CATEGORY, PermissionAction.CREATE) ? (
        <StyledButton
          onClick={(e) => {
            dialogs.open(CategoryFormDialog, { defaultValues: null });
            e.preventDefault();
          }}
        >
          <Add />
        </StyledButton>
      ) : null}
      <StyledButton
        sx={{
          ml: "auto",
        }}
        title={t("label.search_blocks_panel_header")}
        onClick={(e) => {
          onSearchClick(e);
        }}
      >
        <SearchIcon />
      </StyledButton>
    </StyledGrid>
  );
};
