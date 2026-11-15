function readEnv(read: () => string | undefined): string | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}

export const API_URL = (readEnv(() => process.env.BUN_PUBLIC_API_URL) ?? "").replace(/\/$/, "");

export const USE_BACKEND = API_URL !== "";

export const API_HEADERS: Record<string, string> = API_URL.includes("ngrok") ? { "ngrok-skip-browser-warning": "1" } : {};

export const TWIST_PRICE = Number(readEnv(() => process.env.BUN_PUBLIC_TWIST_PRICE) ?? 50);

export const STRIPE_KEY = readEnv(() => process.env.BUN_PUBLIC_STRIPE_KEY) ?? "";
