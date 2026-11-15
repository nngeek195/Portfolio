'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { Link as LinkIcon, Radio, Send, X } from 'lucide-react';

// --- COMMS HANDLER (AI digital twin chatbot) ---
type ChatMessage = { sender: 'user' | 'bot'; text: string; isError?: boolean };

const CHATBOT_ID = 'bot-DuTBQafi';
const CHATBOT_APP_URL = 'https://wikizeroai.vercel.app';
const CHATBOT_API_URL = `${CHATBOT_APP_URL}/api/chat/${CHATBOT_ID}`;

// Dispatch this on window to open the widget (used by the Comms section).
export const OPEN_COMMS_EVENT = 'comms:open';

function isUrl(str: string) {
  return /^https?:\/\/\S+$/.test(str);
}

// Splits bot text on raw URLs, linkifies them inline, and appends a
// tappable "link card" per URL — mirrors the original vanilla-JS parser.
function ChatBubble({ sender, text, isError }: ChatMessage) {
  const isUser = sender === 'user';
  const urlSplitRegex = /(https?:\/\/[^\s]+)/g;
  const parts = !isUser && !isError ? text.split(urlSplitRegex) : [text];
  const links = !isUser && !isError ? (text.match(urlSplitRegex) || []) : [];

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] break-words px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'clip-corner-sm bg-bone font-medium text-void'
            : isError
              ? 'border border-signal/60 bg-signal/10 text-signal'
              : 'bg-gunmetal text-bone ring-1 ring-inset ring-steel'
        }`}
      >
        {!isUser && (
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-nv">{isError ? 'Signal lost' : 'Handler'}</p>
        )}
        <p className="whitespace-pre-wrap">
          {parts.map((part, idx) =>
            isUrl(part) ? (
              <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="break-all text-nv underline">
                {part}
              </a>
            ) : (
              <span key={idx}>{part}</span>
            )
          )}
        </p>

        {links.length > 0 && (
          <div className="mt-2 space-y-2">
            {links.map((url, idx) => {
              let domain = url;
              try {
                domain = new URL(url).hostname;
              } catch {}
              return (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-void px-3 py-2 ring-1 ring-inset ring-steel transition-colors hover:ring-nv"
                >
                  <LinkIcon size={14} className="flex-shrink-0 text-nv" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-bone">{domain}</div>
                    <div className="text-[10px] text-ash">Tap to view link</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Channel open. Ask me anything about my professional background.' },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatHistoryRef = useRef<{ role: string; parts: { text: string }[] }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isOpen]);

  // Open from elsewhere on the page (Comms section), close with Escape.
  useEffect(() => {
    const open = () => setIsOpen(true);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener(OPEN_COMMS_EVENT, open);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(OPEN_COMMS_EVENT, open);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || isSending) return;

    setMessages((prev) => [...prev, { sender: 'user', text: message }]);
    chatHistoryRef.current = [...chatHistoryRef.current, { role: 'user', parts: [{ text: message }] }];
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch(CHATBOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: chatHistoryRef.current, newMessage: message }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Connection failed.');
      }

      const data = await response.json();
      const botResponse = data.response;
      setMessages((prev) => [...prev, { sender: 'bot', text: botResponse }]);
      chatHistoryRef.current = [...chatHistoryRef.current, { role: 'model', parts: [{ text: botResponse }] }];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setMessages((prev) => [...prev, { sender: 'bot', text: `Error: ${message}`, isError: true }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Trigger: radio handset */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open comms handler (AI chat)"
        className={`clip-corner fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center bg-bone text-void shadow-[0_0_0_1px_rgb(124_255_91/0.5),0_0_24px_rgb(124_255_91/0.25)] transition-[opacity,transform] hover:scale-105 ${
          isOpen ? 'pointer-events-none scale-75 opacity-0' : 'opacity-100'
        }`}
      >
        <Radio size={24} aria-hidden="true" />
      </button>

      {/* Window: full-screen sheet on mobile, floating panel from sm+ */}
      <div
        role="dialog"
        aria-label="Comms handler"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed inset-0 z-50 flex origin-bottom-right flex-col bg-void ring-1 ring-steel transition-all duration-300 sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[32rem] sm:max-h-[85vh] sm:w-96 ${
          isOpen ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-steel bg-gunmetal px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="clip-corner-sm grid h-10 w-10 flex-shrink-0 place-items-center bg-bone text-void">
              <Radio size={18} aria-hidden="true" />
            </div>
            <div>
              <div className="font-display text-lg font-bold uppercase leading-tight tracking-wide text-bone">Comms handler</div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-nv">
                <span className="h-1.5 w-1.5 rounded-full bg-nv" aria-hidden="true"></span>
                Online · AI digital twin
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setIsOpen(false)} aria-label="Close comms handler" className="flex-shrink-0 p-2 text-ash hover:text-bone">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" data-lenis-prevent aria-live="polite">
          {messages.map((m, i) => (
            <ChatBubble key={i} sender={m.sender} text={m.text} isError={m.isError} />
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="flex gap-1.5 bg-gunmetal px-4 py-3 ring-1 ring-inset ring-steel" aria-label="Handler is typing">
                <span className="h-2 w-2 animate-bounce bg-ash [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 animate-bounce bg-ash [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 animate-bounce bg-ash"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex flex-shrink-0 items-center gap-2 border-t border-steel bg-gunmetal px-4 py-4">
          <label htmlFor="comms-input" className="sr-only">
            Message
          </label>
          <span className="font-mono text-nv" aria-hidden="true">
            &gt;
          </span>
          <input
            id="comms-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Transmit a message…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-2 font-mono text-sm text-bone placeholder:text-ash/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            aria-label="Send message"
            className="clip-corner-sm grid h-10 w-10 flex-shrink-0 place-items-center bg-bone text-void transition-colors hover:bg-white disabled:opacity-40"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </form>
      </div>
    </>
  );
}
