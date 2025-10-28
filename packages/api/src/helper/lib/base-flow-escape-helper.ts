/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import EventWrapper from '@/channel/lib/EventWrapper';
import { BlockStub } from '@/chat/dto/block.dto';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

import { HelperService } from '../helper.service';
import { FlowEscape, HelperName, HelperType } from '../types';

import BaseHelper from './base-helper';

export default abstract class BaseFlowEscapeHelper<
  N extends HelperName = HelperName,
> extends BaseHelper<N> {
  protected readonly type: HelperType = HelperType.FLOW_ESCAPE;

  constructor(
    name: N,
    settingService: SettingService,
    helperService: HelperService,
    logger: LoggerService,
  ) {
    super(name, settingService, helperService, logger);
  }

  /**
   * Checks if the helper can handle the flow escape for the given block message.
   *
   * @param _blockMessage - The block message to check.
   * @returns - Whether the helper can handle the flow escape for the given block message.
   */
  abstract canHandleFlowEscape<T extends BlockStub>(block: T): boolean;

  /**
   * Adjudicates the flow escape event.
   *
   * @param _event - The event wrapper containing the event data.
   * @param _block - The block associated with the event.
   * @returns - A promise that resolves to a FlowEscape.AdjudicationResult.
   */
  abstract adjudicate<T extends BlockStub>(
    event: EventWrapper<any, any>,
    block: T,
  ): Promise<FlowEscape.AdjudicationResult>;
}
