/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

export namespace LudwigNlu {
  export interface ExampleEntity {
    entity: string;
    value: string;
    start?: number;
    end?: number;
  }

  export type NluProcessedResultType = Record<
    string,
    {
      name: string;
      confidence: number;
    }
  > & { intent_ranking: any[]; entities: ParseEntity[]; text: string };

  export interface LudwigNluDataSample {
    text: string;
    language: string;
    [traitName: string]: string;
    slots: string;
  }

  export interface Prediction<T> {
    [x: string]: any;
    predictions: T;
    probabilities: number[];
    probability: number;
  }

  export interface Status {
    status: string;
  }

  export interface LudwigNluResultType<T> {
    [key: string]: {
      predictions: Prediction<T>;
      status: Status;
    };
  }
}

export interface ParseEntity {
  entity: string; // Entity name
  value: string; // Value name
  confidence: number;
  start?: number;
  end?: number;
}

export interface ParseEntities {
  entities: ParseEntity[];
}
