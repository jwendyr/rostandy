import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface Agent {
  system_prompt: string;
  model: string;
  temperature: number;
}

interface ChatMessage {
  role: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, session_id, tts } = await request.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const sid = session_id || crypto.randomUUID();

    // Get active agent config
    const agent = db.prepare('SELECT system_prompt, model, temperature FROM agents WHERE is_active = 1 ORDER BY id ASC LIMIT 1').get() as Agent | undefined;
    const systemPrompt = agent?.system_prompt || 'You are a helpful assistant for Wendy Rostandy\'s portfolio website.';
    const model = agent?.model || 'gemini-2.5-flash';
    const temperature = agent?.temperature ?? 0.7;

    // Save user message
    db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(sid, 'user', message);

    // Get recent history
    const history = db.prepare('SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id DESC LIMIT 20').all(sid) as ChatMessage[];
    history.reverse();

    // Build Gemini API request
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Map model name to Gemini API model ID
    const modelMap: Record<string, string> = {
      'gemini-2.5-flash': 'gemini-2.5-flash-preview-05-20',
      'gemini-2.5-pro': 'gemini-2.5-pro-preview-05-06',
      'gemini-2.0-flash': 'gemini-2.0-flash',
    };
    const geminiModel = modelMap[model] || 'gemini-2.5-flash-preview-05-20';

    const contents = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature, maxOutputTokens: 2048 },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    // Save assistant message
    db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(sid, 'assistant', reply);

    // Generate TTS if requested
    let audioUrl = null;
    if (tts) {
      try {
        const { execFileSync } = await import('child_process');
        const audioPath = `/tmp/tts-${sid}-${Date.now()}.wav`;
        const voice = process.env.PIPER_VOICE || 'en_US-john-medium';
        // Try piper TTS
        execFileSync('piper', ['--model', voice, '--output_file', audioPath], {
          input: reply.slice(0, 500),
          timeout: 10000,
        });
        audioUrl = `/api/chat/audio?file=${encodeURIComponent(audioPath)}`;
      } catch {
        // TTS not available, skip silently
      }
    }

    return NextResponse.json({ reply, session_id: sid, audioUrl });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
