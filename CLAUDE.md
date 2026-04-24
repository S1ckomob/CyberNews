# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## This is NOT the Next.js you know

Running on **Next.js 16.2** with **React 19.2**. APIs, conventions, and file structure may differ from training data. Before writing or restructuring anything App-Router-related (route handlers, metadata, caching, params, `generateStaticParams`, server actions, error/not-found boundaries, middleware, image/font handling), read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices. `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/manifest.ts`, and `src/app/opengraph-image.tsx` are the Next 16 metadata-file form — do not resurrect the legacy `sitemap.xml/route.ts` / `robots.txt/route.ts` shapes.

## Commands

```bash
npm run dev     # next dev — local http://localhost:3000
npm run build   # next build
npm run lint    # eslint (flat config via eslint-config-next)
npm run start   # next start (after build)
```

No test runner is configured. Type-check with `npx tsc --noEmit --project tsconfig.json`; stale errors in `.next/dev/types/validator.ts` after deleting routes are cleared by `rm -rf .next/dev/types`.

Supabase migrations live in [supabase/migrations/](supabase/migrations/). There is no automated migration runner wired into npm scripts; apply via the Supabase dashboard SQL editor or `supabase db push` (requires project linking + DB password).

## Architecture

### Data model and Supabase split

Two tables carry most of the app: **`articles`** (threat reports, CVEs, tags, category, threat_level, industries[]) and **`threat_actors`**. A third, **`alert_rules`**, stores per-subscriber filters. Canonical column list is in [supabase/migrations/20240101000000_create_tables.sql](supabase/migrations/20240101000000_create_tables.sql); generated row types live in [src/lib/database.types.ts](src/lib/database.types.ts).

Two Supabase clients coexist and are not interchangeable:
- [src/lib/supabase.ts](src/lib/supabase.ts) — **anon key**, used by client components. During build it returns a dummy client that yields empty arrays so SSG doesn't fail without env vars.
- [src/lib/supabase-server.ts](src/lib/supabase-server.ts) — **service role key**, used only in API routes that need to bypass RLS.

RLS is enabled on all tables ([supabase/migrations/20240103000000_rls_and_cleanup.sql](supabase/migrations/20240103000000_rls_and_cleanup.sql)).

### Row → domain shape

Postgres columns are `snake_case`; TS domain types are `camelCase`. Each page that reads Supabase redefines a small `rowToArticle(row: ArticleRow): Article` helper — this is intentional (avoids a shared dependency) but it means changes to [src/lib/types.ts](src/lib/types.ts) or the schema often require updating several of these helpers. [src/lib/queries.ts](src/lib/queries.ts) has the server-side versions used by server components.

[src/lib/data.ts](src/lib/data.ts) is legacy in-memory seed data that is **not** used by any runtime page — don't read from it.

### Category is an allow-listed string in four places

`articles.category` is a `text` column with a **CHECK constraint** pinning it to a fixed allow-list (added in [supabase/migrations/20260424000001_category_check_constraint.sql](supabase/migrations/20260424000001_category_check_constraint.sql)). The same list exists as:
1. The TS union `Category` in [src/lib/types.ts](src/lib/types.ts).
2. The zod enum in [src/app/api/classify/route.ts](src/app/api/classify/route.ts) (used by the Claude classifier).
3. String arrays in the ingest fallback ([src/app/api/ingest/route.ts](src/app/api/ingest/route.ts) `guessCategory`), the admin UI, alert/subscribe validators, and several filter picker components.

**Adding or renaming a category requires a new migration (rewrite the CHECK) plus updates to all four layers** — otherwise the DB rejects the row or the UI stops rendering it. `alert_rules.categories` (text[]) has an equivalent subset-of CHECK.

### Ingest pipeline

RSS feeds → [src/app/api/ingest/route.ts](src/app/api/ingest/route.ts) parses with `fast-xml-parser`, runs `guessThreatLevel` / `guessCategory` heuristics, extracts CVEs + threat-actor names from [src/lib/threat-actors-list.ts](src/lib/threat-actors-list.ts), slugifies, dedupes on slug, and inserts via the service-role client. On insert it calls [src/lib/alert-matcher.ts](src/lib/alert-matcher.ts) to fire personalized emails (Resend) and [src/lib/slack.ts](src/lib/slack.ts) for critical alerts.

Two cron entry points both invoke the ingest handler:
- `/api/cron` — Vercel scheduled job (`vercel.json` → daily 06:00 UTC), authenticated by Vercel's `CRON_SECRET`.
- `/api/ingest-cron` — external trigger (e.g. cron-job.org), authenticated by `EXTERNAL_CRON_KEY` / `INGEST_API_KEY`.

`/api/classify` is a separate Claude-powered classifier (AI SDK + `@ai-sdk/anthropic`, model `claude-sonnet-4-6`) used for manual submissions; its zod enum is the authoritative machine-readable category list.

### API auth and hardening

Every mutating API route is expected to:
1. Call `rateLimit(request, bucket)` — [src/lib/rate-limit.ts](src/lib/rate-limit.ts), Upstash-backed, buckets `public` / `sensitive` / `heavy`.
2. Call `requireApiAuth(request)` ([src/lib/api-auth.ts](src/lib/api-auth.ts)) or a custom Bearer check.
3. For public browser-origin POSTs, validate CSRF via [src/lib/csrf.ts](src/lib/csrf.ts) / [src/lib/csrf-client.ts](src/lib/csrf-client.ts).
4. Call `logAudit(request, event, meta)` on success.

Repeated auth failures are tracked in-process and page an email via Resend after 10/hour.

### Environment variables

Required (see [.env.local.example](.env.local.example)): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `INGEST_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`, `EXTERNAL_CRON_KEY`, `ADMIN_API_KEY`, `CONTACT_EMAIL`. Upstash (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) is optional — rate limiting degrades to a no-op without it.

### UI stack

Tailwind v4 (PostCSS-based, no `tailwind.config.js`), shadcn-generated primitives under [src/components/ui/](src/components/ui/), `lucide-react` icons, `next-themes` for dark mode. Command palette is globally mounted via [src/lib/command-palette-context.tsx](src/lib/command-palette-context.tsx). `threat-critical` / `threat-high` / `threat-medium` / `threat-low` Tailwind colors are semantic — use them, don't hand-pick hex.
