export const buildURL = (baseUrl: string, relativePath: string): string => {
  try {
    const url = new URL(relativePath, baseUrl);

    return url.toString();
  } catch {
    throw new Error(`Invalid base URL: ${baseUrl}`);
  }
};
