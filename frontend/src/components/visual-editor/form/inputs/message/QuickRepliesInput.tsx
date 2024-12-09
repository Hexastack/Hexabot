/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Abc, LocationOn, RemoveCircleOutline } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import { Box, Grid, IconButton } from "@mui/material";
import { FC, Fragment, useEffect, useMemo, useState } from "react";

import DropdownButton, {
  DropdownButtonAction,
} from "@/app-components/buttons/DropdownButton";
import { useTranslate } from "@/hooks/useTranslate";
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
  minInput = 1,
}) => {
  const { t } = useTranslate();
  const [quickReplies, setQuickReplies] = useState<
    ValueWithId<StdQuickReply>[]
  >(value.map((quickReply) => createValueWithId(quickReply)));
  const actions: DropdownButtonAction[] = useMemo(
    () => [
      {
        icon: <Abc />,
        name: t("button.text"),
        defaultValue: {
          content_type: QuickReplyType.text,
          title: "",
          payload: "",
        },
      },
      {
        icon: <LocationOn />,
        name: t("button.location"),
        defaultValue: {
          content_type: QuickReplyType.location,
        },
      },
    ],
    [t],
  );
  const addInput = (defaultValue: StdQuickReply) => {
    setQuickReplies([...quickReplies, createValueWithId(defaultValue)]);
  };
  const removeInput = (index: number) => {
    const updatedQuickReplies = [...quickReplies];

    updatedQuickReplies.splice(index, 1);
    setQuickReplies(
      updatedQuickReplies.length
        ? updatedQuickReplies
        : [
            createValueWithId({
              content_type: QuickReplyType.text,
              title: "",
              payload: "",
            }),
          ],
    );
  };
  const updateInput = (index: number) => (p: StdQuickReply) => {
    quickReplies[index].value = p;
    setQuickReplies([...quickReplies]);
  };

  useEffect(() => {
    onChange(quickReplies.map(({ value }) => value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickReplies]);

  return (
    <Box>
      <Grid container spacing={2}>
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
        <Grid item xs={1}>
          &nbsp;
        </Grid>
        {quickReplies.map(({ value, id }, idx) => (
          <Fragment key={id}>
            <QuickReplyInput
              value={value}
              idx={idx}
              onChange={updateInput(idx)}
            />
            <Grid item xs={1}>
              <IconButton
                color="error"
                size="medium"
                onClick={() => removeInput(idx)}
                disabled={quickReplies.length <= minInput}
              >
                <RemoveCircleOutline />
              </IconButton>
            </Grid>
          </Fragment>
        ))}
      </Grid>
      <DropdownButton
        sx={{ marginTop: 2, float: "right" }}
        label={t("button.add_quick_reply")}
        actions={actions}
        onClick={(action) => addInput(action.defaultValue)}
        icon={<AddIcon />}
        disabled={quickReplies.length > 10}
      />
    </Box>
  );
};

export default QuickRepliesInput;
