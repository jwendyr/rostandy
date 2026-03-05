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

// Map language codes to Piper voice models (best available from /opt/piper/voices/)
const voiceMap: Record<string, { voice: string; lang: string }> = {
  ar: { voice: 'ar_JO-kareem-medium', lang: 'Arabic' },
  da: { voice: 'da_DK-talesyntese-medium', lang: 'Danish' },
  de: { voice: 'de_DE-thorsten-medium', lang: 'German' },
  el: { voice: 'el_GR-rapunzelina-low', lang: 'Greek' },
  en: { voice: 'en_US-john-medium', lang: 'English' },
  es: { voice: 'es_ES-davefx-medium', lang: 'Spanish' },
  fi: { voice: 'fi_FI-harri-medium', lang: 'Finnish' },
  fr: { voice: 'fr_FR-siwis-medium', lang: 'French' },
  he: { voice: 'he-custom-medium-optimized', lang: 'Hebrew' },
  hi: { voice: 'hi_IN-pratham-medium', lang: 'Hindi' },
  id: { voice: 'id_ID-john-medium-optimized', lang: 'Indonesian' },
  it: { voice: 'it_IT-paola-medium', lang: 'Italian' },
  ja: { voice: 'ja-male-medium-optimized', lang: 'Japanese' },
  ko: { voice: 'ko-male-medium-optimized', lang: 'Korean' },
  ms: { voice: 'ms', lang: 'Malay' },
  nl: { voice: 'nl_BE-nathalie-medium', lang: 'Dutch' },
  no: { voice: 'no_NO-talesyntese-medium', lang: 'Norwegian' },
  pl: { voice: 'pl_PL-darkman-medium', lang: 'Polish' },
  pt: { voice: 'pt_BR-cadu-medium', lang: 'Portuguese' },
  ru: { voice: 'ru_RU-denis-medium', lang: 'Russian' },
  sv: { voice: 'sv_SE-lisa-medium', lang: 'Swedish' },
  sw: { voice: 'sw_CD-lanfrica-medium', lang: 'Swahili' },
  tr: { voice: 'tr_TR-dfki-medium', lang: 'Turkish' },
};

function detectLanguage(acceptLang: string | null): { voice: string; lang: string; code: string } {
  if (!acceptLang) return { ...voiceMap.en, code: 'en' };

  // Parse Accept-Language: "id-ID,id;q=0.9,en-US;q=0.8" → ["id", "en"]
  const langs = acceptLang
    .split(',')
    .map(part => {
      const [tag, q] = part.trim().split(';q=');
      return { code: tag.split('-')[0].toLowerCase(), q: q ? parseFloat(q) : 1.0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { code } of langs) {
    if (voiceMap[code]) {
      return { ...voiceMap[code], code };
    }
  }

  return { ...voiceMap.en, code: 'en' };
}

export async function POST(request: NextRequest) {
  try {
    const { message, session_id, tts } = await request.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const sid = session_id || crypto.randomUUID();

    // Detect visitor language from Accept-Language header
    const acceptLang = request.headers.get('accept-language');
    const detected = detectLanguage(acceptLang);

    const agent = db.prepare('SELECT system_prompt, model, temperature FROM agents WHERE is_active = 1 ORDER BY id ASC LIMIT 1').get() as Agent | undefined;
    const basePrompt = agent?.system_prompt || 'You are a helpful assistant for Wendy Rostandy\'s portfolio website.';
    const model = agent?.model || 'gemini-2.5-flash';
    const temperature = agent?.temperature ?? 0.7;

    // Append language instruction to system prompt
    const langInstruction = detected.code === 'en'
      ? ''
      : `\n\nIMPORTANT: The visitor's browser language is ${detected.lang} (${detected.code}). Respond in ${detected.lang}. If they write in English, still respond in ${detected.lang} unless they explicitly ask for English.`;
    const systemPrompt = basePrompt + langInstruction;

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

    // Generate TTS if requested — use detected language voice
    let audioUrl = null;
    if (tts) {
      try {
        const audioFile = `tts-${Date.now()}.wav`;
        const audioPath = `/tmp/${audioFile}`;
        const voiceModel = `/opt/piper/voices/${detected.voice}.onnx`;

        // Verify voice file exists, fallback to English
        const actualVoice = fs.existsSync(voiceModel)
          ? voiceModel
          : '/opt/piper/voices/en_US-john-medium.onnx';

        const cleanText = reply.replace(/[#*_`\[\]()>]/g, '').slice(0, 500);

        execFileSync('/usr/local/bin/piper', [
          '--model', actualVoice,
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

    return NextResponse.json({
      reply,
      session_id: sid,
      audioUrl,
      language: { code: detected.code, name: detected.lang },
    });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
