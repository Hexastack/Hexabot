/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, CardContent, CardHeader, Chip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { mockRecentRuns } from "../mockData";

const columns: GridColDef[] = [
  { field: "time", headerName: "Time", flex: 0.8 },
  { 
      field: "workflow", 
      headerName: "Workflow", 
      flex: 1.5,
      renderCell: (params) => (
          <Typography variant="body2" fontWeight="medium">
              {params.value}
          </Typography>
      )
  },
  { field: "type", headerName: "Type", flex: 1 },
  { field: "trigger", headerName: "Trigger", flex: 1 },
  { 
    field: "status", 
    headerName: "Status", 
    flex: 1,
    renderCell: (params) => {
        let color: "success" | "warning" | "error" | "default" = "default";

        if (params.value === "Success") color = "success";
        if (params.value === "Warning") color = "warning";
        if (params.value === "Failed") color = "error";
        
return <Chip label={params.value} color={color} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
    }
  },
  { field: "duration", headerName: "Duration", flex: 0.8 },
];

export const RecentRuns = () => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: "100%", borderRadius: 3, boxShadow: '0px 2px 10px rgba(0,0,0,0.03)' }}>
      <CardHeader 
        title="Recent Runs" 
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
      />
      <CardContent sx={{ height: '100%', width: '100%', p: 0, '& .MuiDataGrid-root': { border: 'none' } }}>
         <DataGrid
            rows={mockRecentRuns}
            columns={columns}
            initialState={{
            pagination: {
                paginationModel: {
                pageSize: 5,
                },
            },
            }}
            pageSizeOptions={[5]}
            disableRowSelectionOnClick
            density="comfortable"
            sx={{ 
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    borderBottom: `1px solid ${theme.palette.divider}`,
                },
                '& .MuiDataGrid-cell': {
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                },
                '& .MuiDataGrid-row:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.04)
                }
             }}
        />
      </CardContent>
    </Card>
  );
};
