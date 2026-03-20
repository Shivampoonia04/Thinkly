import ChatClient from '../components/ChatClient';
import { ShieldAlert, Terminal as TerminalIcon, Lock, Zap } from 'lucide-react';

export default function Page() {
  return (
    <div className="container">
      <div className="card" style={{ padding: '24px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        {/* Subtle background pattern */}
        <div style={{ 
          position: 'absolute', 
          top: -20, 
          right: -20, 
          opacity: 0.05, 
          transform: 'rotate(15deg)' 
        }}>
          <ShieldAlert size={200} />
        </div>

        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '65%' }}>
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              <div style={{ 
                background: 'var(--brand)', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '10px', 
                fontWeight: 900,
                letterSpacing: '0.1em'
              }}>
                INTERNAL TOOL
              </div>
              <div className="muted2" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Thinkly Labs — v1.0.4
              </div>
            </div>
            
            <h1 style={{ fontSize: 32, fontWeight: 900, marginTop: 0, marginBottom: 12, lineHeight: 1.1 }}>
              Secure Code <span className="text-brand2">Companion</span>
            </h1>
            
            <p className="muted" style={{ fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              An expert-level cybersecurity advisor for modern web development. 
              Built on OWASP standards to help you ship secure code faster.
            </p>

            <div className="row" style={{ marginTop: 20, gap: 16 }}>
              <div className="row" style={{ gap: 6 }}>
                <Lock size={14} className="text-brand2" />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Zero-Trust Logic</span>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <TerminalIcon size={14} className="text-brand2" />
                <span style={{ fontSize: 12, fontWeight: 600 }}>RAG-Enhanced</span>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <Zap size={14} className="text-brand2" />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Real-time Audit</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
            <div className="pill" style={{ cursor: 'default', background: 'rgba(124,92,255,0.1)', borderColor: 'rgba(124,92,255,0.3)' }}>
              <span style={{ color: 'var(--brand2)', fontWeight: 800 }}>●</span> ONLINE
            </div>
            <div className="muted2" style={{ fontSize: 11, textAlign: 'right' }}>
              CONTEXT: NEXT.JS / REACT / NODE<br />
              DATABASE: OWASP_KB_2024
            </div>
          </div>
        </div>
      </div>

      <ChatClient />

      <footer style={{ marginTop: 32, textAlign: 'center' }}>
        <div className="muted2" style={{ fontSize: 12 }}>
          &copy; 2024 Thinkly Labs Engineering. For internal assessment purposes only.
        </div>
      </footer>
    </div>
  );
}

