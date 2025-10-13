/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useMutation } from "react-query";

import { TMutationOptions } from "@/services/types";
import {
  IInvitation,
  IInvitationAttributes,
  IInvitationStub,
} from "@/types/invitation.types";

import { useApiClient } from "../useApiClient";

export const useSendInvitation = (
  options?: TMutationOptions<
    IInvitationStub,
    Error,
    IInvitationAttributes,
    unknown
  >,
) => {
  const { apiClient } = useApiClient();

  return useMutation<IInvitation, Error, IInvitationAttributes>({
    ...options,
    async mutationFn(payload: IInvitationAttributes) {
      return await apiClient.invite(payload);
    },
  });
};
