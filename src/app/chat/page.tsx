'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getLocaleFromNavigator, t as getT } from '@/lib/i18n';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string | null;
}

interface AgentProfile {
  name: string;
  avatarUrl: string;
  description: string;
  greeting: string;
  suggestions: string[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const locale = useMemo(() => getLocaleFromNavigator(), []);
  const t = useMemo(() => getT(locale), [locale]);

  // Fetch agent profile from japri (via proxy), passing detected language
  useEffect(() => {
    fetch(`/api/chat/agent?lang=${locale}`)
      .then(r => r.json())
      .then(data => { if (data.name) setAgent(data); })
      .catch(() => {});
  }, [locale]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, session_id: sessionId, tts: ttsEnabled, lang: locale }),
      });
      const data = await res.json();
      if (data.session_id) setSessionId(data.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error, audioUrl: data.audioUrl }]);

      if (data.audioUrl) {
        new Audio(data.audioUrl).play().catch(() => {});
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: t.chat.error }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  const avatar = agent?.avatarUrl;

  return (
    <div className="min-h-screen flex flex-col bg-bg" dir={locale === 'ar' ? 'rtl' : undefined}>
      {/* Header with agent identity */}
      <header className="border-b border-border bg-bg-card/95 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-2.5 flex items-center gap-3">
        <Link href="/" className="text-text-muted hover:text-text-primary transition-colors shrink-0" aria-label="Back">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>

        {/* Agent avatar + name */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {avatar ? (
            <div className="relative shrink-0">
              <img src={avatar} alt={agent?.name || ''} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-accent/30" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-bg-card" />
            </div>
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <span className="text-accent text-sm font-bold">AI</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-semibold text-text-primary truncate">{agent?.name || 'AI Assistant'}</p>
            <p className="text-[10px] sm:text-xs text-emerald-400">online</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-[10px] sm:text-xs text-text-muted cursor-pointer select-none">
            <input type="checkbox" checked={ttsEnabled} onChange={e => setTtsEnabled(e.target.checked)} className="accent-accent w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.chat.voiceTts}</span>
            <span className="sm:hidden">TTS</span>
          </label>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto w-full">
          {/* Empty state — agent intro */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center text-center pt-8 sm:pt-16 pb-4">
              {avatar ? (
                <img src={avatar} alt={agent?.name || ''} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-accent/20 mb-4" />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <span className="text-accent text-2xl sm:text-3xl font-bold">AI</span>
                </div>
              )}
              <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-1.5">
                {agent?.name || 'AI Assistant'}
              </h2>
              <p className="text-text-muted text-xs sm:text-sm max-w-sm px-4 mb-6">
                {agent?.greeting || t.chat.description}
              </p>

              {/* Suggestions from japri */}
              <div className="flex flex-col xs:flex-row flex-wrap justify-center gap-2 px-2 w-full max-w-md">
                {(agent?.suggestions || [t.chat.suggestion1, t.chat.suggestion2, t.chat.suggestion3]).map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-[11px] sm:text-xs px-3.5 py-2 rounded-xl border border-border bg-bg-card text-text-muted hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all text-start"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-text-dim mt-6">
                Powered by <span className="text-accent/70">japri.com</span>
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`mb-3 sm:mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {/* Agent avatar on assistant messages */}
              {msg.role === 'assistant' && (
                avatar ? (
                  <img src={avatar} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 mb-0.5 ring-1 ring-border" />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mb-0.5">
                    <span className="text-accent text-[10px] font-bold">AI</span>
                  </div>
                )
              )}

              <div className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent text-white rounded-br-md'
                  : 'bg-bg-card text-text-muted border border-border rounded-bl-md'
              }`}>
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                {msg.audioUrl && (
                  <button
                    onClick={() => new Audio(msg.audioUrl!).play().catch(() => {})}
                    className={`text-[10px] mt-1.5 hover:underline ${msg.role === 'user' ? 'text-white/70' : 'text-accent'}`}
                  >
                    &#x1F50A; {t.chat.replay}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="mb-3 sm:mb-4 flex justify-start items-end gap-2">
              {avatar ? (
                <img src={avatar} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 mb-0.5 ring-1 ring-border" />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mb-0.5">
                  <span className="text-accent text-[10px] font-bold">AI</span>
                </div>
              )}
              <div className="bg-bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-text-dim animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-text-dim animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-text-dim animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-bg-card px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <input
            ref={inputRef}
            className="flex-1 bg-bg border border-border rounded-full px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors"
            placeholder={t.chat.placeholder}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={loading}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-accent rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-accent/90 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4 text-white ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
