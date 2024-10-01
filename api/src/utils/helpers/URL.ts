export const buildURL = (baseUrl: string, relativePath: string): string => {
  try {
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const normalizedRelativePath = relativePath.startsWith('/')
      ? relativePath.slice(1)
      : relativePath;
    const url = new URL(normalizedRelativePath, normalizedBaseUrl);

    return url.toString();
  } catch {
    throw new Error(`Invalid base URL: ${baseUrl}`);
  }
};
