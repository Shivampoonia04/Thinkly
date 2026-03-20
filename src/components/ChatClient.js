"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Shield, 
  Lock, 
  Terminal, 
  Copy, 
  Check, 
  RotateCcw, 
  Send, 
  Trash2, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Command,
  Info
} from 'lucide-react';

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const CodeBlock = ({ children }) => {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button 
        className="copyBtn" 
        onClick={copy}
        title="Copy code"
      >
        {copied ? <Check size={14} className="text-ok" /> : <Copy size={14} />}
      </button>
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
};

export default function ChatClient() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const storageKey = 'thinkly:chatMessages';
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const suggestionCards = useMemo(
    () => [
      {
        id: 'threat-model',
        header: 'Threat Modeling',
        text: 'Give me a quick threat model for a login + password reset flow.',
        icon: <Shield size={16} />
      },
      {
        id: 'owasp',
        header: 'OWASP Top 10',
        text: 'What are the most common OWASP Top 10 risks in a typical React app?',
        icon: <Lock size={16} />
      },
      {
        id: 'xss-csrf',
        header: 'XSS & CSRF',
        text: 'How do I prevent XSS and CSRF in Next.js for authenticated users?',
        icon: <Terminal size={16} />
      },
      {
        id: 'auth-checklist',
        header: 'Auth Checklist',
        text: 'Show a secure authentication checklist for sessions + refresh tokens.',
        icon: <Command size={16} />
      }
    ],
    []
  );

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      setMessages(
        parsed
          .filter((m) => m && m.role && !m.isLoading)
          .map((m) => ({ ...m, isLoading: false }))
      );
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const persisted = messages.filter((m) => m && m.role && !m.isLoading);
      window.localStorage.setItem(storageKey, JSON.stringify(persisted));
    } catch {}
  }, [messages]);

  async function send(text) {
    const content = (text || '').trim();
    if (!content) return;
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMsg = { id: uid(), role: 'user', content };
    const assistantId = uid();
    const assistantMsg = {
      id: assistantId,
      role: 'assistant',
      content: '',
      sources: [],
      isLoading: true
    };

    const next = [...messages, userMsg, assistantMsg];
    setMessages(next);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.filter(m => !m.isLoading).map((m) => ({ role: m.role, content: m.content })),
          topic: 'cybersecurity'
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m;
          return {
            ...m,
            content: data.reply || 'No response returned.',
            sources: Array.isArray(data.sources) ? data.sources : [],
            isLoading: false
          };
        })
      );
    } catch (e) {
      const msg = e?.message || 'Something went wrong.';
      setError(msg);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m;
          return {
            ...m,
            content: `Error: ${msg}`,
            sources: [],
            isLoading: false,
            isError: true
          };
        })
      );
    } finally {
      setIsLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setInput('');
    setError(null);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {}
    inputRef.current?.focus?.();
  }

  function retryLast() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) send(lastUser.content);
  }

  return (
    <div className="card cardGlow" style={{ padding: '20px' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="statusIndicator">
          <div className="statusDot" />
          <span>SECURITY ADVISOR ACTIVE</span>
        </div>
        <button className="pill" onClick={clearChat} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Trash2 size={14} /> Clear Terminal
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="emptyStateCard">
          <div className="emptyStateTitle">
            <Shield className="text-brand2" size={24} />
            Initialize Security Audit
          </div>
          <div className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
            Type a query below to scan for vulnerabilities or get mitigation strategies based on secure coding standards.
          </div>
          <div className="suggestionGrid">
            {suggestionCards.map((card) => (
              <div
                key={card.id}
                className="suggestionItem"
                onClick={() => send(card.text)}
              >
                <div className="suggestionHeader">
                  {card.icon}
                  {card.header}
                </div>
                <div className="suggestionText">{card.text}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div ref={listRef} className="chatList" style={{ minHeight: messages.length > 0 ? '300px' : '0' }}>
        {messages.map((m) => (
          <div key={m.id} className={`message ${m.role === 'user' ? 'user' : 'assistant'}`} style={{ marginBottom: 16 }}>
            <div className="messageHeader">
              <div className="roleTag" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {m.role === 'user' ? <Info size={12} /> : <Shield size={12} />}
                {m.role === 'user' ? 'OPERATOR' : 'SECURE_BOT'}
              </div>
            </div>
            
            {m.isLoading ? (
              <div style={{ padding: '4px 0' }}>
                <div className="skeleton" style={{ height: 14, width: '92%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '86%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '78%' }} />
                <div className="typingRow">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            ) : (
              <div className={`messageContent ${m.isError ? 'text-danger' : ''}`}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    pre: ({ node, ...props }) => <div {...props} />,
                    code: ({ node, inline, className, children, ...props }) => {
                      if (inline) return <code className={className} {...props}>{children}</code>;
                      return <CodeBlock>{children}</CodeBlock>;
                    }
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            )}

            {m.role === 'assistant' && !m.isLoading && m.sources && m.sources.length > 0 ? (
              <div className="sourceCard">
                <div className="sourceTitle" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ExternalLink size={13} /> VERIFIED SOURCES
                </div>
                {m.sources.slice(0, 3).map((s, idx) => (
                  <div key={idx} style={{ marginBottom: 8 }}>
                    <div className="muted2" style={{ fontSize: 11, fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ChevronRight size={10} /> {s.title}
                    </div>
                    <div className="sourceExcerpt" style={{ fontSize: 12, opacity: 0.8 }}>{s.excerpt}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {m.isError && (
              <button className="btn errorRetryBtn" onClick={retryLast} style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <RotateCcw size={14} /> Retry Request
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="row" style={{ marginTop: 20, position: 'relative' }}>
        <textarea
          ref={inputRef}
          className="input"
          placeholder="Ask a security question (e.g., 'How to secure JWT in cookies?')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          disabled={isLoading}
        />
        <button 
          className="btn" 
          style={{ 
            position: 'absolute', 
            right: 8, 
            bottom: 8, 
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }} 
          onClick={() => send(input)}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? '...' : <Send size={18} />}
        </button>
      </div>
      <div className="muted2" style={{ marginTop: 12, fontSize: 11, textAlign: 'center' }}>
        SYSTEM: AES-256 ENCRYPTED SESSION • DATA SOURCE: OWASP 2024 • BUILD: 1.0.4
      </div>
    </div>
  );
}
