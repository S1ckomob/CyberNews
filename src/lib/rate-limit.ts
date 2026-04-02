import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

// --- Pre-configured limiters for different endpoint tiers ---

/** Public endpoints: subscribe, alerts, search — 20 requests per 60s */
const publicLimiter = () => {
  const r = getRedis();
  return r
    ? new Ratelimit({ redis: r, limiter: Ratelimit.slidingWindow(20, "60 s"), prefix: "rl:public" })
    : null;
};

/** Sensitive endpoints: admin, classify — 10 requests per 60s */
const sensitiveLimiter = () => {
  const r = getRedis();
  return r
    ? new Ratelimit({ redis: r, limiter: Ratelimit.slidingWindow(10, "60 s"), prefix: "rl:sensitive" })
    : null;
};

/** Heavy endpoints: ingest, digest — 5 requests per 60s */
const heavyLimiter = () => {
  const r = getRedis();
  return r
    ? new Ratelimit({ redis: r, limiter: Ratelimit.slidingWindow(5, "60 s"), prefix: "rl:heavy" })
    : null;
};

type Tier = "public" | "sensitive" | "heavy";

const limiterForTier: Record<Tier, () => Ratelimit | null> = {
  public: publicLimiter,
  sensitive: sensitiveLimiter,
  heavy: heavyLimiter,
};

/**
 * Apply rate limiting. Returns null if allowed, or a 429 response if rate limited.
 * Gracefully degrades (allows request) if Redis is not configured.
 */
export async function rateLimit(
  request: NextRequest,
  tier: Tier = "public"
): Promise<NextResponse | null> {
  const limiter = limiterForTier[tier]();
  if (!limiter) return null; // Redis not configured — allow through

  const ip = getIp(request);
  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}
