import { NextRequest, NextResponse } from 'next/server';

const JAPRI_API_URL = process.env.JAPRI_API_URL || 'https://api.japri.com';
const JAPRI_API_KEY = process.env.JAPRI_API_KEY || '';
const AGENT_BASE = process.env.JAPRI_AGENT || 'rostandy';

const SUPPORTED_LANGS = new Set(['id','ja','ko','zh','fr','de','es','pt','ar','hi','ru','tr','it','nl']);

/** Cache per language slug */
const cache = new Map<string, { data: any; time: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

function resolveAgent(lang?: string): string {
  if (!lang) return AGENT_BASE;
  const code = lang.split('-')[0].toLowerCase();
  return SUPPORTED_LANGS.has(code) ? `${AGENT_BASE}-${code}` : AGENT_BASE;
}

export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get('lang') || '';
  const slug = resolveAgent(lang);

  // Check cache
  const cached = cache.get(slug);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const res = await fetch(`${JAPRI_API_URL}/api/public/agent/${slug}`, {
      headers: { 'X-API-Key': JAPRI_API_KEY },
    });

    if (!res.ok) {
      // Fallback to default English agent
      if (slug !== AGENT_BASE) {
        const fallback = await fetch(`${JAPRI_API_URL}/api/public/agent/${AGENT_BASE}`, {
          headers: { 'X-API-Key': JAPRI_API_KEY },
        });
        if (fallback.ok) {
          const data = await fallback.json();
          cache.set(AGENT_BASE, { data, time: Date.now() });
          return NextResponse.json(data);
        }
      }
      return NextResponse.json({ error: 'Agent not found' }, { status: 502 });
    }

    const data = await res.json();
    cache.set(slug, { data, time: Date.now() });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 });
  }
}
