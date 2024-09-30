/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Action,
  InputType,
  ActionEvent,
} from "@projectstorm/react-canvas-core";

export interface CustomDeleteItemsActionOptions {
  keyCodes?: number[];
  callback?: (ids: string[], next: () => void) => void;
}
export class CustomDeleteItemsAction extends Action {
  constructor(options: CustomDeleteItemsActionOptions = {}) {
    options = {
      keyCodes: [46, 8],
      ...options,
    };
    super({
      type: InputType.KEY_DOWN,
      // @ts-ignore
      fire: (event: ActionEvent<React.KeyboardEvent>) => {
        if (options?.keyCodes?.indexOf(event.event.keyCode) !== -1) {
          const selectedEntities = this.engine.getModel().getSelectedEntities();

          if (selectedEntities.length > 0) {
            options.callback?.(
              selectedEntities.map((model) => model.getID()),
              () => {
                selectedEntities.forEach((model) => {
                  model.setLocked(false);
                  model.remove();
                });

                this.engine.repaintCanvas();
              },
            );
          }
        }
      },
    });
  }
}
