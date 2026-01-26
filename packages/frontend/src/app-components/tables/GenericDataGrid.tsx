/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Chip } from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  DataGridProps,
  GridColDef,
  GridRowSelectionModel,
} from "@mui/x-data-grid";

import { useDataGridProps } from "@/hooks/useDataGridProps";
import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";
import { PageHeader } from "@/layout/content/PageHeader";
import { IFindConfigProps, THook } from "@/types/base.types";
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
import { type Filter, GenericFilters } from "./GenericFilters";

export const GenericDataGrid = <
  TP extends THook["params"],
  TE extends TP["entity"],
  F extends TP["format"],
>({
  entity,
  buttons,
  columns,
  headerIcon,
  searchParams,
  initialSortState,
  initialPaginationState,
  format,
  headerI18nTitle,
  headerTitleChip,
  headerLeftButtons,
  selectionChangeHandler,
  filters,
  hasTextFilter = true,
  ...restDataGridProps
}: {
  entity: TE;
  buttons?: ButtonActionsGroupProps["buttons"];
  headerIcon?: TMenuItem["Icon"];
  searchParams: TParamItem<TE> &
    SearchHookOptions & {
      getFindParams?: (searchPayload: SearchPayload<TE>) => SearchPayload<TE>;
    };
  format?: F;
  columns: GridColDef<THook<{ entity: TE; format: F }>["current"]>[];
  headerI18nTitle?: TTranslationKeys;
  headerTitleChip?: string;
  headerLeftButtons?: React.ReactElement;
  selectionChangeHandler?: (selection: GridRowSelectionModel) => void;
  filters?: Filter[];
  hasTextFilter?: boolean;
} & Pick<IFindConfigProps<TE>, "initialSortState" | "initialPaginationState"> &
  DataGridProps) => {
  const { t } = useTranslate();
  const { dataGridProps, onSearch, searchText } = useDataGridProps(
    {
      entity,
      format: format as any,
    },
    {
      searchParams,
      initialSortState,
      initialPaginationState,
    },
  );

  return (
    <Grid container gap={3} flexDirection="column" width="100%">
      <Grid>
        {headerLeftButtons}
        <PageHeader
          icon={headerIcon}
          title={headerI18nTitle && t(headerI18nTitle)}
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
            {hasTextFilter ? (
              <FilterTextfield onChange={onSearch} defaultValue={searchText} />
            ) : null}
            {filters?.length ? <GenericFilters filters={filters} /> : null}
            <Grid size="auto">
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
