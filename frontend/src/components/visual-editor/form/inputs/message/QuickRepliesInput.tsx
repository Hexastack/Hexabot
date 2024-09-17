/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, Grid, IconButton } from "@mui/material";
import { FC, Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { QuickReplyType, StdQuickReply } from "@/types/message.types";
import { ValueWithId, createValueWithId } from "@/utils/valueWithId";

import QuickReplyInput from "./QuickReplyInput";

type QuickRepliesInput = {
  value: StdQuickReply[];
  onChange: (patterns: StdQuickReply[]) => void;
  minInput?: number;
};


const QuickRepliesInput: FC<QuickRepliesInput> = ({
  value,
  onChange,
  minInput = 0,
}) => {
  const { t } = useTranslation();
  const [quickReplies, setQuickReplies] = useState<
    ValueWithId<StdQuickReply>[]
  >(value.map((quickReplie) => createValueWithId(quickReplie)));
  const addInput = () => {
    setQuickReplies([
      ...quickReplies,
      createValueWithId({
        content_type: QuickReplyType.text,
        title: "",
        payload: "",
      }),
    ]);
  };
  const removeInput = (index: number) => {
    const updatedQuickReplies = [...quickReplies];

    updatedQuickReplies.splice(index, 1);
    // Set updated state only if it's greater than minInput
    setQuickReplies(
      updatedQuickReplies.length > minInput
        ? updatedQuickReplies
        : updatedQuickReplies.length ? updatedQuickReplies : []
    );
  };
  const updateInput = (index: number) => (p: StdQuickReply) => {
    quickReplies[index].value = p;
    setQuickReplies([...quickReplies]);
  };

  useEffect(() => {
    if (
      quickReplies.length === 0 ||
      (quickReplies.length === 1 &&
      quickReplies[0]?.value?.title?.trim() === "" &&
      quickReplies[0]?.value?.payload?.trim() === "")
    ) {
      onChange([]);
    } else {
      onChange(quickReplies.map(({ value }) => value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickReplies,onChange]);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={1}>
          &nbsp;
        </Grid>
        <Grid item xs={2}>
          {t("label.type")}
        </Grid>
        <Grid item xs={4}>
          {t("label.title")}
        </Grid>
        <Grid item xs={1} />
        <Grid item xs={4}>
          {t("label.payload")}
        </Grid>
        {quickReplies.map(({ value, id }, idx) => (
          <Fragment key={id}>
            <Grid item xs={1}>
              <IconButton
                size="medium"
                onClick={() => removeInput(idx)}
                disabled={quickReplies.length <= minInput}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
            <QuickReplyInput
              value={value}
              idx={idx}
              onChange={updateInput(idx)}
            />
          </Fragment>
        ))}
      </Grid>
      <Button
        variant="contained"
        color="primary"
        onClick={addInput}
        startIcon={<AddIcon />}
        sx={{ marginTop: 2, float: "right" }}
        disabled={quickReplies.length > 10}
      >
        {t("button.add")}
      </Button>
    </Box>
  );
};

export default QuickRepliesInput;
