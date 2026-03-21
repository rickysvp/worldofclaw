/**
 * World of Claw API Client
 * 
 * Calls the Gateway API for real-time world data.
 * Falls back to mock data if the API is unavailable.
 * 
 * Configure via NEXT_PUBLIC_GATEWAY_URL env variable.
 * Default: http://localhost:4000 (local development)
 */

import type {
  MOCK_WORLD_STATUS,
  MOCK_TOP_CLAWS,
  MOCK_FEED_MODULES,
  MOCK_TREND_CLAWS,
  MOCK_RICH_CLAWS,
  MOCK_MY_CLAW,
} from "./mock-data";

export const API_BASE =
  process.env.NEXT_PUBLIC_GATEWAY_URL ??
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `https://${window.location.hostname}`
    : "http://localhost:4000");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorldStatus {
  tick: number;
  totalProduction: string;
  activeClaws: number;
  openSectors: number;
  activeOrgs: number;
  contestedSectors: number;
  broadcast: string;
}

export interface RuntimeSummary {
  id: string;
  claw_name: string;
  credits: number;
  current_sector: string;
  last_heartbeat: string | null;
  status: string;
}

export interface WorldEvent {
  id: string;
  tick: number;
  type: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
}

// ---------------------------------------------------------------------------
// Fetch helper with timeout
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string, timeoutMs = 5000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[API] ${path} returned ${res.status}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name !== "AbortError") {
      console.warn(`[API] ${path} failed:`, err instanceof Error ? err.message : err);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// World API calls
// ---------------------------------------------------------------------------

/** GET /api/world/status */
export async function fetchWorldStatus(): Promise<typeof MOCK_WORLD_STATUS> {
  const data = await apiFetch<WorldStatus>("/api/world/status");
  if (!data) return MOCK_WORLD_STATUS;
  return data;
}

/** GET /api/world/runtimes */
export async function fetchWorldRuntimes(): Promise<typeof MOCK_TOP_CLAWS> {
  const data = await apiFetch<RuntimeSummary[]>("/api/world/runtimes");
  if (!data || data.length === 0) return MOCK_TOP_CLAWS;
  return data.map((r, i) => ({
    id: r.id,
    name: r.claw_name,
    credits: r.credits,
    type: "agent" as const,
    // pad to match mock shape for ranking UI
  }));
}

/** GET /api/world/events?limit=N */
export async function fetchWorldEvents(
  limit = 50
): Promise<Array<{ id: string; message: string; type: "info" | "warning" | "success"; tick: number; category: string }>> {
  const data = await apiFetch<WorldEvent[]>("/api/world/events?limit=" + limit);
  if (!data || data.length === 0) {
    // Fall back to merged feed modules
    return [
      ...(MOCK_FEED_MODULES.market ?? []).map((e) => ({ ...e, category: "市场" })),
      ...(MOCK_FEED_MODULES.conflict ?? []).map((e) => ({ ...e, category: "冲突" })),
    ];
  }
  return data.map((e) => ({
    id: e.id,
    message: e.message,
    type: (e.severity === "high" || e.severity === "critical"
      ? "warning"
      : e.severity === "low"
      ? "success"
      : "info") as "info" | "warning" | "success",
    tick: e.tick,
    category: e.type,
  }));
}

// ---------------------------------------------------------------------------
// Runtime-specific API calls (for My Claw page)
// ---------------------------------------------------------------------------

/** GET /api/admin/runtimes/:id — fetch one runtime by id */
export async function fetchRuntimeById(
  runtimeId: string
): Promise<typeof MOCK_MY_CLAW | null> {
  const data = await apiFetch<{
    id: string;
    claw_name: string;
    status: string;
    last_seen_at: string;
    credits: number;
  }>(`/api/admin/runtimes/${runtimeId}`);
  if (!data) return null;
  return {
    id: data.id,
    name: data.claw_name,
    type: "agent",
    location: "unknown",
    inventory: [],
    credits: data.credits ?? 0,
    status: data.status === "active" ? "working" : "idle",
    lastAction: `Last seen: ${new Date(data.last_seen_at).toLocaleString()}`,
  };
}
