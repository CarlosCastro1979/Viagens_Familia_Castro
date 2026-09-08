import type { AppData } from "@/lib/types";

export type CloudConfig = {
  url: string;
  key: string;
  rowId: string;
};

export const DEFAULT_CLOUD: CloudConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qnscwppgljobelplgbkp.supabase.co",
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  rowId: process.env.NEXT_PUBLIC_SUPABASE_ROW_ID || "carlos_castro_trips",
};

const CONFIG_KEY = "familia_castro_supabase";

export function readCloudConfig(): CloudConfig {
  if (typeof window === "undefined") return DEFAULT_CLOUD;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CLOUD };
    const parsed = JSON.parse(raw) as Partial<CloudConfig>;
    return {
      url: parsed.url || DEFAULT_CLOUD.url,
      key: parsed.key || DEFAULT_CLOUD.key,
      rowId: parsed.rowId || DEFAULT_CLOUD.rowId,
    };
  } catch {
    return { ...DEFAULT_CLOUD };
  }
}

export function writeCloudConfig(config: CloudConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function cloudHeaders(key: string, extra?: HeadersInit): HeadersInit {
  const trimmed = key.trim();
  const headers: Record<string, string> = {
    apikey: trimmed,
    "Content-Type": "application/json",
  };
  if (trimmed.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${trimmed}`;
  }
  return { ...headers, ...(extra as Record<string, string> | undefined) };
}

function cloudErrorMessage(status: number, body: string) {
  const snippet = body.replace(/\s+/g, " ").slice(0, 180);
  if (status === 401 || status === 403) {
    if (/invalid jwt/i.test(body) || /sb_publishable/i.test(body)) {
      return "Esta chave não é JWT. Em Câmbios cola a Publishable (começa por sb_publishable_).";
    }
    return snippet
      ? `Supabase recusou a chave (${status}). ${snippet}`
      : "Chave do Supabase inválida. Em API Keys abre «Publishable and secret» e cola a Publishable.";
  }
  return snippet || `Supabase ${status}`;
}

async function sbFetch(config: CloudConfig, path: string, opts: RequestInit = {}) {
  const url = config.url.replace(/\/$/, "");
  return fetch(`${url}${path}`, {
    ...opts,
    headers: cloudHeaders(config.key, opts.headers),
  });
}

export async function loadFromCloud(config = readCloudConfig()): Promise<AppData | null> {
  if (!config.url || !config.key) return null;
  const res = await sbFetch(
    config,
    `/rest/v1/fct_trips?id=eq.${encodeURIComponent(config.rowId)}&select=data`,
  );
  if (!res.ok) {
    throw new Error(cloudErrorMessage(res.status, await res.text()));
  }
  const rows = (await res.json()) as { data?: AppData }[];
  if (rows?.[0]?.data?.trips) return rows[0].data;
  return null;
}

export async function saveToCloud(data: AppData, config = readCloudConfig()) {
  if (!config.url || !config.key) {
    throw new Error("Falta a chave do Supabase.");
  }
  const res = await sbFetch(config, "/rest/v1/fct_trips", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: config.rowId,
      data,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.
