'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { MessageCircle, Send, X, Link as LinkIcon } from 'lucide-react';

// --- DIGITAL TWIN CHATBOT ---
type ChatMessage = { sender: 'user' | 'bot'; text: string; isError?: boolean };

const CHATBOT_ID = 'bot-DuTBQafi';
const CHATBOT_APP_URL = 'https://wikizeroai.vercel.app';
const CHATBOT_API_URL = `${CHATBOT_APP_URL}/api/chat/${CHATBOT_ID}`;

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
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${
          isUser
            ? 'bg-cyan-600 text-black rounded-br-sm font-medium'
            : isError
            ? 'bg-red-950/40 border border-red-900 text-red-400 rounded-bl-sm'
            : 'bg-gray-800 text-slate-200 rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap">
          {parts.map((part, idx) =>
            isUrl(part) ? (
              <a
                key={idx}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline break-all"
              >
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
                  className="flex items-center gap-2 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 hover:border-cyan-500 transition-colors"
                >
                  <LinkIcon size={14} className="text-cyan-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">{domain}</div>
                    <div className="text-[10px] text-slate-500">Tap to view link</div>
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
    { sender: 'bot', text: 'Hello! Ask me anything about my professional background.' },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatHistoryRef = useRef<{ role: string; parts: { text: string }[] }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isOpen]);

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
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
        className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-[0_0_25px_rgba(34,211,238,0.5)] flex items-center justify-center hover:scale-110 transition-all ${
          isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100'
        }`}
      >
        <MessageCircle size={26} />
      </button>

      {/* Chat window: full-screen sheet on mobile, floating card from sm+ */}
      <div
        className={`fixed z-50 bg-gray-950 border border-cyan-900/50 shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col transition-all duration-300 origin-bottom-right
          inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-96 sm:h-[32rem] sm:rounded-2xl sm:max-h-[85vh]
          ${isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
        role="dialog"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-900/50 bg-black/60 sm:rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
              AI
            </div>
            <div>
              <div className="text-slate-100 font-bold leading-tight">Digital Twin</div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Online
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
            className="text-slate-400 hover:text-white p-2 flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
          {messages.map((m, i) => (
            <ChatBubble key={i} sender={m.sender} text={m.text} isError={m.isError} />
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-4 border-t border-cyan-900/50 bg-black/60 sm:rounded-b-2xl flex-shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            className="flex-1 bg-gray-900 text-white text-sm rounded-full px-4 py-3 border border-gray-700 outline-none focus:border-cyan-500 min-w-0"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            aria-label="Send message"
            className="w-11 h-11 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}
