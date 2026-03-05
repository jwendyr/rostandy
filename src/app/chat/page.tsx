'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

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

      // Auto-play TTS if available
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play().catch(() => {});
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold gradient-text">WR</Link>
          <span className="text-text-muted text-sm">Chat with Wendy&apos;s AI Assistant</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
            <input type="checkbox" checked={ttsEnabled} onChange={e => setTtsEnabled(e.target.checked)} className="accent-accent" />
            Voice (TTS)
          </label>
          <Link href="/" className="btn-secondary text-xs">Back to Portfolio</Link>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">&#x1F916;</div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Ask me anything</h2>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              I&apos;m Wendy&apos;s AI assistant. Ask about his projects, skills, experience, or anything else.
              {ttsEnabled && ' Voice responses are enabled.'}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['What projects has Wendy built?', 'Tell me about his ML experience', 'What tech stack does he use?'].map(q => (
                <button key={q} onClick={() => { setInput(q); }} className="text-xs px-3 py-1.5 rounded-full border border-border text-text-muted hover:text-accent hover:border-accent/30 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-accent/10 text-text-primary border border-accent/20'
                : 'bg-bg-card text-text-muted border border-border'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.audioUrl && (
                <button onClick={() => new Audio(msg.audioUrl!).play().catch(() => {})} className="text-[10px] text-accent mt-2 hover:underline">
                  &#x1F50A; Replay
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="mb-4 flex justify-start">
            <div className="bg-bg-card border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-bg-card px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            className="input-field flex-1"
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={loading}
          />
          <button onClick={send} disabled={loading || !input.trim()} className="btn-primary">Send</button>
        </div>
      </div>
    </div>
  );
}
