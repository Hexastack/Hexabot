/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  Credential as SharedCredential,
  CredentialFull as SharedCredentialFull,
  CredentialStub as SharedCredentialStub,
} from "@hexabot-ai/types";

export interface ICredentialAttributes {
  name: string;
  value: string;
  owner: string | null;
}

export type ICredentialStub = SharedCredentialStub;

export type Credential = SharedCredential;

export type CredentialFull = SharedCredentialFull;

export type CredentialWithValue = Credential & {
  value?: string;
};
