/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { userProfileBaseSchema } from "../shared/profile";

export const userProfileStubSchema = userProfileBaseSchema;

export const userProfileSchema = userProfileBaseSchema;

export const userProfileFullSchema = userProfileBaseSchema;

export type UserProfileStub = z.infer<typeof userProfileStubSchema>;

export type UserProfile = z.infer<typeof userProfileSchema>;

export type UserProfileFull = z.infer<typeof userProfileFullSchema>;
