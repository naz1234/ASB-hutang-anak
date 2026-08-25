/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  TRACKER?: DurableObjectNamespaceLike;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface DurableObjectNamespaceLike {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(request: Request): Promise<Response> };
}

interface DurableObjectStateLike {
  storage: {
    get<T>(key: string): Promise<T | undefined>;
    put<T>(key: string, value: T): Promise<void>;
  };
}

type Child = {
  id: string;
  name: string;
  debt: number;
  monthlyTarget: number;
  withdrawalDate: string;
  color: string;
};

type Payment = {
  id: string;
  childId: string;
  amount: number;
  date: string;
  note: string;
};

type TrackerState = {
  children: Child[];
  payments: Payment[];
  updatedAt: string;
};

const TRACKER_STORAGE_KEY = "tracker";
const SHARED_TRACKER_NAME = "shared-family-record-v1";
const JSON_HEADERS = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
};

function json(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isFinitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isTrackerState(value: unknown): value is TrackerState {
  if (!isRecord(value) || !Array.isArray(value.children) || !Array.isArray(value.payments)) return false;
  if (value.children.length === 0 || value.children.length > 20 || value.payments.length > 10_000) return false;
  if (typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt))) return false;

  const childIds = new Set<string>();
  for (const child of value.children) {
    if (!isRecord(child)
      || typeof child.id !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(child.id)
      || typeof child.name !== "string" || child.name.trim().length === 0 || child.name.length > 100
      || !isFinitePositive(child.debt) || !isFinitePositive(child.monthlyTarget)
      || typeof child.withdrawalDate !== "string" || child.withdrawalDate.length > 20
      || typeof child.color !== "string" || child.color.length > 30
      || childIds.has(child.id)) return false;
    childIds.add(child.id);
  }

  return value.payments.every((payment) => isRecord(payment)
    && typeof payment.id === "string" && payment.id.length > 0 && payment.id.length <= 100
    && typeof payment.childId === "string" && childIds.has(payment.childId)
    && isFinitePositive(payment.amount)
    && typeof payment.date === "string" && payment.date.length <= 20
    && typeof payment.note === "string" && payment.note.length <= 500);
}

function trackerName(request: Request) {
  const key = request.headers.get("x-sync-key")?.trim().toLowerCase() ?? "";
  if (!key) return SHARED_TRACKER_NAME;
  return /^[a-f0-9]{32}$/.test(key) ? SHARED_TRACKER_NAME : null;
}

export class TrackerStore {
  constructor(private readonly state: DurableObjectStateLike) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method === "GET") {
      const tracker = await this.state.storage.get<TrackerState>(TRACKER_STORAGE_KEY);
      return tracker ? json(tracker) : json({ error: "No tracker data" }, 404);
    }

    if (request.method === "PUT") {
      const contentLength = Number(request.headers.get("content-length") ?? "0");
      if (contentLength > 1_000_000) return json({ error: "Payload too large" }, 413);

      let tracker: unknown;
      try {
        tracker = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      if (!isTrackerState(tracker)) return json({ error: "Invalid tracker data" }, 400);

      await this.state.storage.put(TRACKER_STORAGE_KEY, tracker);
      return json(tracker);
    }

    return json({ error: "Method not allowed" }, 405, { allow: "GET, PUT" });
  }
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/tracker") {
      const name = trackerName(request);
      if (!name) return json({ error: "Invalid sync key" }, 401);
      if (!env.TRACKER) return json({ error: "Tracker storage is unavailable" }, 503);

      const id = env.TRACKER.idFromName(name);
      return env.TRACKER.get(id).fetch(request);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
