export const buildURL = (baseUrl: string, relativePath: string): string => {
  try {
    return new URL(relativePath).toString();
  } catch {
    try {
      return new URL(
        relativePath.replace(/^\//, ''),
        baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
      ).toString();
    } catch {
      throw new Error(`Invalid base URL: ${baseUrl}`);
    }
  }
};
