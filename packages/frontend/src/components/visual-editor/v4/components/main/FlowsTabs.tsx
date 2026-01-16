/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Button, Grid, styled, Tab, Tabs, tabsClasses } from "@mui/material";
import { SyntheticEvent } from "react";

import { useWorkflow } from "../../hooks/useWorkflow";

const StyledGrid = styled(Grid)(() => ({
  display: "flex",
  position: "relative",
  background: "#fff",
  flexDirection: "row",
  alignItems: "center",
  borderBottom: "1.5px solid #DDDDDD",
}));
const StyledTabs = styled(Tabs)(() => ({
  backgroundColor: "#fff",
  flex: 1,
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
const StyledNewButton = styled(Button)(() => ({
  minHeight: "30px",
  textTransform: "none",
  backgroundColor: "#1ca089",
  color: "#fff",
  "&:hover": {
    backgroundColor: "#178872",
  },
}));
const StyledEditButton = styled(Button)(() => ({
  minHeight: "30px",
  textTransform: "none",
  color: "#1ca089",
  border: "1px solid #1ca089",
  "&:hover": {
    borderColor: "#178872",
    backgroundColor: "#e6f5f2",
  },
}));
const StyledActions = styled(Grid)(() => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  margin: "7px 8px 0 auto",
}));

type FlowsTabsProps = {
  onNew?: () => void;
  onEdit?: () => void;
};

export const FlowsTabs = ({ onNew, onEdit }: FlowsTabsProps) => {
  const { workflows, selectedFlowId, updateWorkflowURL } = useWorkflow();
  const changeHandler = (_event: SyntheticEvent, workflowId: string) => {
    updateWorkflowURL(workflowId);
  };
  const handleNew = () => {
    onNew?.();
  };
  const handleEdit = () => {
    onEdit?.();
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
      <StyledActions>
        {onEdit && (
          <StyledEditButton
            variant="outlined"
            size="small"
            onClick={handleEdit}
            disabled={!selectedFlowId}
          >
            Edit
          </StyledEditButton>
        )}
        <StyledNewButton
          variant="contained"
          size="small"
          onClick={handleNew}
          disabled={!onNew}
        >
          New
        </StyledNewButton>
      </StyledActions>
    </StyledGrid>
  );
};
