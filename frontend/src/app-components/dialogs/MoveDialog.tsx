/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  MenuItem,
  Select,
} from "@mui/material";

import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { DialogControl } from "@/hooks/useDialog";
import { useTranslate } from "@/hooks/useTranslate";
import { ICategory } from "@/types/category.types";

export interface MoveDialogProps<T = never>
  extends Omit<DialogControl<T>, "callback"> {
  categories: ICategory[];
  callback?: (selectedCategoryId?: T, ids?: T[]) => Promise<void>;
}

export const MoveDialog = <T,>({
  data: ids,
  datum: selectedCategoryId,
  ...rest
}: MoveDialogProps<T>) => {
  const { t } = useTranslate();
  const handleMove = async () => {
    if (selectedCategoryId && rest.callback) {
      await rest.callback(selectedCategoryId, ids);
      rest.reset?.();
    }
  };

  return (
    <Dialog open={rest.open} fullWidth onClose={rest.closeDialog}>
      <DialogTitle onClose={rest.closeDialog}>
        {t("message.select_category")}
      </DialogTitle>
      <DialogContent>
        <Grid container direction="column" gap={2}>
          <Grid item>
            <Select
              value={selectedCategoryId || ""}
              onChange={(e) => rest.setDatum?.(e.target.value as T)}
              fullWidth
              displayEmpty
            >
              <MenuItem value="" disabled>
                {t("label.category")}
              </MenuItem>
              {rest.categories.map(({ id, label }) => (
                <MenuItem key={id} value={id}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={handleMove}
          disabled={!selectedCategoryId}
        >
          {t("button.move")}
        </Button>
        <Button variant="outlined" onClick={rest.closeDialog}>
          {t("button.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
