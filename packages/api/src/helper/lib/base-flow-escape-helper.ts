/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import EventWrapper from '@/channel/lib/EventWrapper';

import { FlowEscape, HelperName, HelperType } from '../types';

import BaseHelper from './base-helper';

export default abstract class BaseFlowEscapeHelper<
  N extends HelperName = HelperName,
> extends BaseHelper<N> {
  protected readonly type: HelperType = HelperType.FLOW_ESCAPE;

  constructor(name: N) {
    super(name);
  }

  /**
   * Checks if the helper can handle the flow escape for the given action payload.
   *
   * @param action - The action payload to check.
   * @returns - Whether the helper can handle the flow escape for the given payload.
   */
  abstract canHandleFlowEscape<T>(action: T): boolean;

  /**
   * Adjudicates the flow escape event.
   *
   * @param _event - The event wrapper containing the event data.
   * @param action - The action associated with the event.
   * @returns - A promise that resolves to a FlowEscape.AdjudicationResult.
   */
  abstract adjudicate<T>(
    event: EventWrapper<any, any>,
    action: T,
  ): Promise<FlowEscape.AdjudicationResult>;
}
