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
import { FC, useState } from "react";

import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { DialogControl } from "@/hooks/useDialog";
import { useTranslate } from "@/hooks/useTranslate";
import { ICategory } from "@/types/category.types";

export interface MoveDialogProps
  extends Omit<DialogControl<string>, "callback"> {
  categories: ICategory[];
  callback?: (newCategoryId?: string) => Promise<void>;
  openDialog: (data?: string) => void;
}

export const MoveDialog: FC<MoveDialogProps> = ({
  open,
  callback,
  closeDialog,
  categories,
}: MoveDialogProps) => {
  const { t } = useTranslate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const handleMove = async () => {
    if (selectedCategoryId && callback) {
      await callback(selectedCategoryId);
      closeDialog();
    }
  };

  return (
    <Dialog open={open} fullWidth onClose={closeDialog}>
      <DialogTitle onClose={closeDialog}>
        {t("message.select_category")}
      </DialogTitle>
      <DialogContent>
        <Grid container direction="column" gap={2}>
          <Grid item>
            <Select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value as string)}
              fullWidth
              displayEmpty
            >
              <MenuItem value="" disabled>
                {t("label.category")}
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.label}
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
        <Button variant="outlined" onClick={closeDialog}>
          {t("button.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
