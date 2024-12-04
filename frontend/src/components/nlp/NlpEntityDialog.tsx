/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Dialog,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import DialogButtons from '@/app-components/buttons/DialogButtons';
import { DialogTitle } from '@/app-components/dialogs/DialogTitle';
import { ContentContainer } from '@/app-components/dialogs/layouts/ContentContainer';
import { ContentItem } from '@/app-components/dialogs/layouts/ContentItem';
import { Input } from '@/app-components/inputs/Input';
import { useCreate } from '@/hooks/crud/useCreate';
import { useUpdate } from '@/hooks/crud/useUpdate';
import { DialogControlProps } from '@/hooks/useDialog';
import { useToast } from '@/hooks/useToast';
import { useTranslate } from '@/hooks/useTranslate';
import { EntityType } from '@/services/types';
import {
  INlpEntity,
  INlpEntityAttributes,
  NlpLookups,
} from '@/types/nlp-entity.types';

export type NlpEntityDialogProps = DialogControlProps<INlpEntity>;
export const NlpEntityDialog: FC<NlpEntityDialogProps> = ({
  open,
  closeDialog,
  data,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { mutateAsync: createNlpEntity } = useCreate(EntityType.NLP_ENTITY, {
    onError: () => {
      toast.error(t('message.internal_server_error'));
    },
    onSuccess: () => {
      closeDialog();
      toast.success(t('message.success_save'));
    },
  });
  const { mutateAsync: updateNlpEntity } = useUpdate(EntityType.NLP_ENTITY, {
    onError: () => {
      toast.error(t('message.internal_server_error'));
    },
    onSuccess: () => {
      closeDialog();
      toast.success(t('message.success_save'));
    },
  });
  const {
    reset,
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<INlpEntityAttributes>({
    defaultValues: {
      name: data?.name || '',
      doc: data?.doc || '',
      lookups: data?.lookups || ['keywords'],
    },
  });
  const validationRules = {
    name: {
      required: t('message.name_is_required'),
    },
    lookups: {},
    isChecked: {},
  };
  const onSubmitForm = async (params: INlpEntityAttributes) => {
    if (data) {
      updateNlpEntity({ id: data.id, params });
    } else {
      createNlpEntity(params);
    }
  };

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        doc: data.doc,
      });
    } else {
      reset();
    }
  }, [data, reset]);

  return (
    <Dialog open={open} fullWidth onClose={closeDialog} {...rest}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={closeDialog}>
          {data ? t('title.edit_nlp_entity') : t('title.new_nlp_entity')}
        </DialogTitle>
        <DialogContent>
          <ContentContainer>
            {!data ? (
              <ContentItem>
                <FormControl>
                  <FormLabel>{t('label.lookup_strategies')}</FormLabel>
                  <RadioGroup
                    row
                    {...register('lookups')}
                    defaultValue="keywords"
                  >
                    {Object.values(NlpLookups).map((nlpLookup, index) => (
                      <FormControlLabel
                        key={index}
                        value={nlpLookup}
                        control={<Radio {...register('lookups.0')} />}
                        label={nlpLookup}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </ContentItem>
            ) : null}
            <ContentItem>
              <Input
                label={t('label.name')}
                error={!!errors.name}
                {...register('name', validationRules.name)}
                required
                autoFocus
                helperText={errors.name ? errors.name.message : null}
              />
            </ContentItem>

            <ContentItem>
              <Input
                label={t('label.doc')}
                {...register('doc')}
                multiline={true}
              />
            </ContentItem>
          </ContentContainer>
        </DialogContent>
        <DialogActions>
          <DialogButtons closeDialog={closeDialog} />
        </DialogActions>
      </form>
    </Dialog>
  );
};
