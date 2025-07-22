/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
