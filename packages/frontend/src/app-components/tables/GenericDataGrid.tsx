/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Chip, Grid } from "@mui/material";
import {
  DataGridProps,
  GridColDef,
  GridRowSelectionModel,
} from "@mui/x-data-grid";

import { useDataGridProps } from "@/hooks/useDataGridProps";
import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";
import { PageHeader } from "@/layout/content/PageHeader";
import { THook } from "@/types/base.types";
import {
  SearchHookOptions,
  SearchPayload,
  TParamItem,
} from "@/types/search.types";

import {
  ButtonActionsGroup,
  ButtonActionsGroupProps,
} from "../buttons/ButtonActionsGroup";
import { FilterTextfield } from "../inputs/FilterTextfield";
import { TMenuItem } from "../menus/Sidebar";

import { DataGrid } from "./DataGrid";

export const GenericDataGrid = <
  TP extends THook["params"],
  TE extends THook<TP>["entity"],
>({
  entity,
  buttons,
  columns,
  headerIcon,
  searchParams,
  headerI18nTitle,
  headerTitleChip,
  headerLeftButtons,
  headerFilterInputs,
  selectionChangeHandler,
  ...restDataGridProps
}: {
  entity: TE;
  buttons?: ButtonActionsGroupProps["buttons"];
  columns: GridColDef<THook<{ entity: TE }>["basic"]>[];
  headerIcon: TMenuItem["Icon"];
  searchParams: TParamItem<TE> &
    SearchHookOptions & {
      getFindParams?: (searchPayload: SearchPayload<TE>) => SearchPayload<TE>;
    };
  headerI18nTitle: TTranslationKeys;
  headerTitleChip?: string;
  headerLeftButtons?: React.ReactElement;
  headerFilterInputs?: React.ReactElement;
  selectionChangeHandler?: (selection: GridRowSelectionModel) => void;
} & DataGridProps) => {
  const { t } = useTranslate();
  const { dataGridProps, onSearch, searchText } = useDataGridProps(
    {
      entity,
    },
    {
      searchParams,
    },
  );

  return (
    <Grid container gap={3} flexDirection="column">
      <Grid>
        {headerLeftButtons}
        <PageHeader
          icon={headerIcon}
          title={t(headerI18nTitle)}
          chip={
            headerTitleChip ? (
              <Chip label={headerTitleChip} size="medium" variant="title" />
            ) : null
          }
        >
          <Grid
            gap={1}
            container
            flexWrap="nowrap"
            width="auto"
            justifyContent="end"
          >
            <Grid item maxWidth="300px">
              <FilterTextfield onChange={onSearch} defaultValue={searchText} />
            </Grid>
            <Grid item>
              {headerFilterInputs}
              {buttons ? (
                <ButtonActionsGroup entity={entity} buttons={buttons} />
              ) : null}
            </Grid>
          </Grid>
        </PageHeader>
      </Grid>
      <DataGrid
        columns={columns}
        {...dataGridProps}
        checkboxSelection={!!selectionChangeHandler}
        onRowSelectionModelChange={selectionChangeHandler}
        {...restDataGridProps}
      />
    </Grid>
  );
};
