/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Add from "@mui/icons-material/Add";
import { Button, Grid, styled, Tab, Tabs, tabsClasses } from "@mui/material";
import { SyntheticEvent } from "react";

import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { useFind } from "@/hooks/crud/useFind";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

import { useWorkflow } from "../../hooks/useWorkflow";

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

export const FlowsTabs = () => {
  const hasPermission = useHasPermission();
  const { selectedFlowId, setSelectedFlowId, updateWorkflowURL } =
    useWorkflow();
  const dialogs = useDialogs();
  const { data: workflows } = useFind(
    {
      entity: EntityType.WORKFLOW,
    },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "asc" }],
    },
  );
  const changeHandler = (_event: SyntheticEvent, workflowId: string) => {
    setSelectedFlowId(workflowId);
    updateWorkflowURL(workflowId);
  };

  return (
    <StyledGrid>
      <StyledTabs
        value={selectedFlowId}
        variant="scrollable"
        onChange={changeHandler}
        allowScrollButtonsMobile
      >
        {workflows?.map(({ id, name }) => (
          <StyledTab key={id} label={<Grid>{name}</Grid>} value={id} />
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
    </StyledGrid>
  );
};
