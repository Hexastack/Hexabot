/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";

interface DialogButtonsProps {
  closeDialog?: () => void;
  handleSubmit?: () => void;
}

const DialogButtons: React.FC<DialogButtonsProps> = ({
  closeDialog,
  handleSubmit,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Button
        startIcon={<CheckIcon />}
        variant="contained"
        type="submit"
        onClick={handleSubmit}
      >
        {t("button.submit")}
      </Button>
      <Button
        startIcon={<CloseIcon />}
        variant="outlined"
        color="error"
        onClick={closeDialog}
      >
        {t("button.cancel")}
      </Button>
    </>
  );
};

export default DialogButtons;
