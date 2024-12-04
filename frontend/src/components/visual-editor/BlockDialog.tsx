/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import {
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Grid,
  Switch,
  Tab,
  Tabs,
} from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import DialogButtons from '@/app-components/buttons/DialogButtons';
import { DialogTitle } from '@/app-components/dialogs/DialogTitle';
import { ContentContainer } from '@/app-components/dialogs/layouts/ContentContainer';
import { ContentItem } from '@/app-components/dialogs/layouts/ContentItem';
import { Input } from '@/app-components/inputs/Input';
import TriggerIcon from '@/app-components/svg/TriggerIcon';
import { TabPanel } from '@/app-components/tabs/TabPanel';
import { useUpdate } from '@/hooks/crud/useUpdate';
import { DialogControlProps } from '@/hooks/useDialog';
import { useToast } from '@/hooks/useToast';
import { useTranslate } from '@/hooks/useTranslate';
import { EntityType } from '@/services/types';
import { OutgoingMessageFormat } from '@/types/message.types';

import { IBlock, IBlockAttributes } from '../../types/block.types';

import BlockFormProvider from './form/BlockFormProvider';
import { MessageForm } from './form/MessageForm';
import { OptionsForm } from './form/OptionsForm';
import { TriggersForm } from './form/TriggersForm';

export type BlockDialogProps = DialogControlProps<IBlock>;
type TSelectedTab = 'triggers' | 'options' | 'messages';

const BlockDialog: FC<BlockDialogProps> = ({
  open,
  data: block,
  closeDialog,
  ...rest
}) => {
  const { t } = useTranslate();
  const [selectedTab, setSelectedTab] = useState<TSelectedTab>('triggers');
  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: TSelectedTab,
  ) => {
    setSelectedTab(newValue);
  };
  const { toast } = useToast();
  const { mutateAsync: updateBlock } = useUpdate(EntityType.BLOCK, {
    onError: () => {
      toast.error(t('message.internal_server_error'));
    },
    onSuccess: () => {
      closeDialog();
      toast.success(t('message.success_save'));
    },
  });
  const DEFAULT_VALUES = {
    name: block?.name || '',
    patterns: block?.patterns || [],
    trigger_labels: block?.trigger_labels || [],
    trigger_channels: block?.trigger_channels || [],
    options: block?.options || {
      typing: 0,
      content: {
        display: OutgoingMessageFormat.list,
        top_element_style: 'compact',
        limit: 2,
      },
      assignTo: block?.options?.assignTo,
      fallback: block?.options?.fallback || {
        active: true,
        message: [],
        max_attempts: 1,
      },
    },
    assign_labels: block?.assign_labels || [],
    message: block?.message || [''],
    capture_vars: block?.capture_vars || [],
  } as IBlockAttributes;
  const methods = useForm<IBlockAttributes>({
    defaultValues: DEFAULT_VALUES,
  });
  const {
    reset,
    register,
    formState: { errors },
    handleSubmit,
    control,
  } = methods;
  const validationRules = {
    name: {
      required: t('message.name_is_required'),
    },
  };
  const onSubmitForm = async (params: IBlockAttributes) => {
    if (block) {
      updateBlock({ id: block.id, params });
    }
  };

  useEffect(() => {
    if (open) {
      reset();
      setSelectedTab('triggers');
    }
  }, [open, reset]);

  useEffect(() => {
    if (block && open) {
      reset(DEFAULT_VALUES);
    } else {
      reset();
    }
  }, [block, reset]);

  return (
    <Dialog open={open} fullWidth maxWidth="md" onClose={closeDialog} {...rest}>
      <BlockFormProvider methods={methods} block={block}>
        <DialogTitle onClose={closeDialog}>{t('title.edit_block')}</DialogTitle>
        <DialogContent>
          <ContentContainer>
            <ContentItem display="flex" gap={5}>
              <Input
                label={t('placeholder.name')}
                {...register('name', validationRules.name)}
                error={!!errors.name}
                autoFocus
                helperText={errors.name ? errors.name.message : null}
              />

              <Controller
                name="starts_conversation"
                control={control}
                defaultValue={block?.starts_conversation}
                render={({ field }) => (
                  <FormControlLabel
                    label={t(`label.starts_conversation`)}
                    {...field}
                    control={<Switch checked={field.value} />}
                  />
                )}
              />
            </ContentItem>
            <ContentItem>
              <Tabs
                orientation="horizontal"
                value={selectedTab}
                onChange={handleChange}
              >
                <Tab
                  value="triggers"
                  label={t('label.triggers')}
                  icon={<TriggerIcon />}
                  iconPosition="start"
                />
                <Tab
                  value="options"
                  label={t('label.options')}
                  icon={<SettingsApplicationsIcon />}
                  iconPosition="start"
                />
                <Tab
                  value="messages"
                  label={t('label.message')}
                  icon={<ChatBubbleOutlineOutlinedIcon />}
                  iconPosition="start"
                />
              </Tabs>
              <Grid sx={{ padding: 2 }}>
                <TabPanel value={selectedTab} index="triggers">
                  <TriggersForm />
                </TabPanel>
                <TabPanel value={selectedTab} index="options">
                  <OptionsForm />
                </TabPanel>
                <TabPanel value={selectedTab} index="messages">
                  <MessageForm />
                </TabPanel>
              </Grid>
            </ContentItem>
          </ContentContainer>
        </DialogContent>
        <DialogActions>
          <DialogButtons
            handleSubmit={handleSubmit(onSubmitForm)}
            closeDialog={closeDialog}
          />
        </DialogActions>
      </BlockFormProvider>
    </Dialog>
  );
};

BlockDialog.displayName = 'BlockDialog';

export default BlockDialog;
