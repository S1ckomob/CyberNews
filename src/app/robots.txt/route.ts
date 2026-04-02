const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cyber-news-five.vercel.app";

export function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
