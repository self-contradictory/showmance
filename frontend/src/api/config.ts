function readEnv(read: () => string | undefined): string | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}

export const API_URL = (readEnv(() => process.env.BUN_PUBLIC_API_URL) ?? "").replace(/\/$/, "");

export const USE_BACKEND = API_URL !== "";

export const TWIST_PRICE = Number(readEnv(() => process.env.BUN_PUBLIC_TWIST_PRICE) ?? 50);
