'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getLocaleFromNavigator, t as getT } from '@/lib/i18n';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string | null;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const locale = useMemo(() => getLocaleFromNavigator(), []);
  const t = useMemo(() => getT(locale), [locale]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, session_id: sessionId, tts: ttsEnabled }),
      });
      const data = await res.json();
      if (data.session_id) setSessionId(data.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error, audioUrl: data.audioUrl }]);

      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play().catch(() => {});
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: t.chat.error }]);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg" dir={locale === 'ar' ? 'rtl' : undefined}>
      {/* Header */}
      <header className="border-b border-border bg-bg-card px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link href="/" className="text-base sm:text-lg font-bold gradient-text shrink-0">WR</Link>
          <span className="text-text-muted text-xs sm:text-sm truncate">{t.chat.heading}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <label className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-text-muted cursor-pointer">
            <input type="checkbox" checked={ttsEnabled} onChange={e => setTtsEnabled(e.target.checked)} className="accent-accent w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">{t.chat.voiceTts}</span>
            <span className="xs:hidden">TTS</span>
          </label>
          <Link href="/" className="btn-secondary !text-[10px] sm:!text-xs !px-2 sm:!px-4 !py-1.5 sm:!py-2">{t.chat.backToPortfolio}</Link>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center py-10 sm:py-20">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">&#x1F916;</div>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-2">{t.chat.askAnything}</h2>
            <p className="text-text-muted text-xs sm:text-sm max-w-md mx-auto px-2">
              {t.chat.description}
              {ttsEnabled && ` ${t.chat.voiceEnabled}`}
            </p>
            <div className="flex flex-col xs:flex-row flex-wrap justify-center gap-2 mt-4 sm:mt-6 px-2">
              {[t.chat.suggestion1, t.chat.suggestion2, t.chat.suggestion3].map(q => (
                <button key={q} onClick={() => { setInput(q); }} className="text-[10px] sm:text-xs px-3 py-1.5 rounded-full border border-border text-text-muted hover:text-accent hover:border-accent/30 transition-colors text-start">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 sm:mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[80%] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm ${
              msg.role === 'user'
                ? 'bg-accent/10 text-text-primary border border-accent/20'
                : 'bg-bg-card text-text-muted border border-border'
            }`}>
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.audioUrl && (
                <button onClick={() => new Audio(msg.audioUrl!).play().catch(() => {})} className="text-[10px] text-accent mt-1.5 sm:mt-2 hover:underline">
                  &#x1F50A; {t.chat.replay}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="mb-3 sm:mb-4 flex justify-start">
            <div className="bg-bg-card border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-bg-card px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto flex gap-2 sm:gap-3">
          <input
            className="input-field flex-1 !text-xs sm:!text-sm !py-2.5"
            placeholder={t.chat.placeholder}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={loading}
          />
          <button onClick={send} disabled={loading || !input.trim()} className="btn-primary !text-xs sm:!text-sm !px-3 sm:!px-4">{t.chat.send}</button>
        </div>
      </div>
    </div>
  );
}
