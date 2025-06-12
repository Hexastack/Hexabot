/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import EventWrapper from '@/channel/lib/EventWrapper';
import { BlockStub } from '@/chat/schemas/block.schema';
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
  abstract canHandleFlowEscape<T extends BlockStub>(_blockMessage: T): boolean;

  /**
   * Adjudicates the flow escape event.
   *
   * @param _event - The event wrapper containing the event data.
   * @param _block - The block associated with the event.
   * @returns - A promise that resolves to a FlowEscape.AdjudicationResult.
   */
  abstract adjudicate<T extends BlockStub>(
    _event: EventWrapper<any, any>,
    _block: T,
  ): Promise<FlowEscape.AdjudicationResult>;
}
