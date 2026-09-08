import type { AppData } from "@/lib/types";

export type CloudConfig = { url: string; key: string; rowId: string };

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

function headersFor(key: string): Record<string, string> {
  const k = key.trim();
  const h: Record<string, string> = { apikey: k, "Content-Type": "application/json" };
  if (k.startsWith("eyJ")) h.Authorization = `Bearer ${k}`;
  return h;
}

async function sbFetch(config: CloudConfig, path: string, opts: RequestInit = {}) {
  return fetch(`${config.url.replace(/\/$/, "")}${path}`, {
    ...opts,
    headers: { ...headersFor(config.key), ...(opts.headers as Record<string, string>) },
  });
}

export async function loadFromCloud(config = readCloudConfig()): Promise<AppData | null> {
  if (!config.url || !config.key) return null;
  const res = await sbFetch(
    config,
    `/rest/v1/fct_trips?id=eq.${encodeURIComponent(config.rowId)}&select=data`,
  );
  if (!res.ok) throw new Error((await res.text()) || `Supabase ${res.status}`);
  const rows = (await res.json()) as { data?: AppData }[];
  return rows?.[0]?.data?.trips ? rows[0].data! : null;
}

export async function saveToCloud(data: AppData, config = readCloudConfig()) {
  if (!config.url || !config.key) throw new Error("Falta a chave do Supabase.");
  const res = await sbFetch(config, "/rest/v1/fct_trips", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: config.rowId, data, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error((await res.text()) || `Supabase ${res.status}`);
}

export async function seedCloudIfEmpty(data: AppData, config = readCloudConfig()) {
  const existing = await loadFromCloud(config);
  if (existing) return existing;
  await saveToCloud(data, config);
  return data;
}
