import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

const JAPRI_API_URL = process.env.JAPRI_API_URL || 'https://api.japri.com';
const JAPRI_API_KEY = process.env.JAPRI_API_KEY || '';
const AGENT_BASE = process.env.JAPRI_AGENT || 'rostandy';

const SUPPORTED_LANGS = new Set(['id','ja','ko','zh','fr','de','es','pt','ar','hi','ru','tr','it','nl']);

/** Resolve agent slug from language code: rostandy-ja, rostandy-id, or rostandy (English default) */
function resolveAgent(lang?: string): string {
  if (!lang) return AGENT_BASE;
  const code = lang.split('-')[0].toLowerCase();
  return SUPPORTED_LANGS.has(code) ? `${AGENT_BASE}-${code}` : AGENT_BASE;
}

export async function POST(request: NextRequest) {
  try {
    const { message, session_id, tts, lang } = await request.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const sid = session_id || crypto.randomUUID();
    const agentSlug = resolveAgent(lang);

    // Save user message locally
    db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(sid, 'user', message);

    // Forward to Japri with the language-specific agent
    const japriRes = await fetch(`${JAPRI_API_URL}/api/public/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': JAPRI_API_KEY,
        'Accept-Language': lang || 'en',
      },
      body: JSON.stringify({ message, session_id: sid, agent: agentSlug, tts: !!tts }),
    });

    if (!japriRes.ok) {
      console.error('Japri API error:', japriRes.status, await japriRes.text());
      return NextResponse.json({ error: 'Chat service unavailable' }, { status: 502 });
    }

    const data = await japriRes.json();

    // Save assistant reply locally
    db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(sid, 'assistant', data.reply);

    let audioUrl = null;
    if (data.audio?.base64) {
      audioUrl = `data:${data.audio.contentType};base64,${data.audio.base64}`;
    }

    return NextResponse.json({
      reply: data.reply,
      session_id: sid,
      audioUrl,
      language: data.language,
      agent: data.agent,
      avatarUrl: data.avatarUrl || null,
    });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
