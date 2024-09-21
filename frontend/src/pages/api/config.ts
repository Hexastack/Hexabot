import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  apiUrl: string;
  ssoEnabled: boolean;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  res.status(200).json({
    apiUrl: process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:4000",
    ssoEnabled: process.env.NEXT_PUBLIC_SSO_ENABLED === "true" || false,
  });
}
