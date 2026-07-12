function requireEnv(
  value: string | undefined,
  name: string
): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const ENV_CONFIG = {
  API_BASE_URL: requireEnv(
    process.env.NEXT_PUBLIC_API_BASE_URL,
    "NEXT_PUBLIC_API_BASE_URL"
  ),

  WS_BASE_URL: requireEnv(
    process.env.NEXT_PUBLIC_WS_BASE_URL,
    "NEXT_PUBLIC_WS_BASE_URL"
  ),
} as const;