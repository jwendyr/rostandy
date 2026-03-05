import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { execFileSync } from 'child_process';
import fs from 'fs';

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

    const agent = db.prepare('SELECT system_prompt, model, temperature FROM agents WHERE is_active = 1 ORDER BY id ASC LIMIT 1').get() as Agent | undefined;
    const systemPrompt = agent?.system_prompt || 'You are a helpful assistant for Wendy Rostandy\'s portfolio website.';
    const model = agent?.model || 'gemini-2.5-flash';
    const temperature = agent?.temperature ?? 0.7;

    db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(sid, 'user', message);

    const history = db.prepare('SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id DESC LIMIT 20').all(sid) as ChatMessage[];
    history.reverse();

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const modelMap: Record<string, string> = {
      'gemini-2.5-flash': 'gemini-2.5-flash',
      'gemini-2.5-pro': 'gemini-2.5-pro',
      'gemini-2.0-flash': 'gemini-2.0-flash',
    };
    const geminiModel = modelMap[model] || 'gemini-2.5-flash';

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

    db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(sid, 'assistant', reply);

    // Generate TTS if requested
    let audioUrl = null;
    if (tts) {
      try {
        const audioFile = `tts-${Date.now()}.wav`;
        const audioPath = `/tmp/${audioFile}`;
        const voiceModel = '/opt/piper/voices/en_US-john-medium.onnx';

        // Strip markdown and limit to ~500 chars for reasonable audio length
        const cleanText = reply.replace(/[#*_`\[\]()>]/g, '').slice(0, 500);

        execFileSync('/usr/local/bin/piper', [
          '--model', voiceModel,
          '--output_file', audioPath,
        ], {
          input: cleanText,
          timeout: 15000,
          env: { ...process.env, LD_LIBRARY_PATH: '/opt/piper/piper' },
        });

        if (fs.existsSync(audioPath)) {
          audioUrl = `/api/chat/audio?f=${audioFile}`;
        }
      } catch (e) {
        console.error('TTS error:', e);
      }
    }

    return NextResponse.json({ reply, session_id: sid, audioUrl });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
