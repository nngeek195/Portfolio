'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase'; // Ensure you import your db
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, Award, FileText, Menu, X, MessageCircle, Send, Link as LinkIcon } from 'lucide-react'; // Add Loader2 for the loading spinner

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// --- HARDCODED CERTIFICATES ---
// Quick stopgap while the Certificates portal isn't the primary data source.
// Raw entries below use whatever fields were easiest to fill in (img/issued/link);
// they're normalized into the same shape Firestore certificates use right after,
// so the rest of the page never has to care which source a certificate came from.
const hardcodedCertificatesRaw = [
  {
    title: "Build Your Own AI Chatbot with Microsoft Foundry",
    issuer: "Microsoft Learn Student Ambassadors - Sri Lanka",
    issued: "Dec 2025",
    img: "https://github.com/nngeek195/Portfilio/blob/main/Images/SAMS.png?raw=true",
  },
  {
    title: "Introduction to FinOps",
    issuer: "FinOps Foundation",
    issued: "Dec 2025",
    img: "https://cc.sj-cdn.net/certificate/2iprv52w108nv/certificate-pdbdz4ebiabb-1765950512.jpg?Expires=1766733906&Signature=FoCucJutcbe~skzwwKBrymJFjDvRc5YkuFvuEQJ8Tp7aKzpxgFMg0aZiWgUoxJCD4Ea5D7VwwgdxVQHdR8pzKFusWSVtv1aj9~XayZk5CFLAtezgqDmjGvUeOPXM9YQ77Q1akt5ORQQR5nzednK0RwVCCJsjRdljSgbF-eCeP~nzZEhj8XtxTXkBgK4cklwePBs9RLgnL3LXFpT3ZjjQzFQKi0YkIOJHnnyKQn4AH8yIEdmS3Fc7UJwleOHvdIXZqubIIHG9xnKwoOTBmdDSB-Xp8urzgroQRaXsK8CteTTipIWNLJbPFW2NzdHFPNAWB5JhVdk17~2VVD~~DthdfQ__&Key-Pair-Id=APKAI3B7HFD2VYJQK4MQ",
    link: "https://verify.skilljar.com/c/pdbdz4ebiabb"
  },
  {
    title: "Introduction to AI",
    issuer: "Coursera",
    issued: "Oct 2025",
    img: "https://s3.amazonaws.com/coursera_assets/meta_images/generated/CERTIFICATE_LANDING_PAGE/CERTIFICATE_LANDING_PAGE~EE12C3N36948/CERTIFICATE_LANDING_PAGE~EE12C3N36948.jpeg",
    link: "https://www.coursera.org/account/accomplishments/verify/EE12C3N36948?utm_source=img&utm_medium=certificate&utm_content=cert_image&utm_campaign=pdf_header_button&utm_product=course"
  },
  {
    title: "Maximize Productivity With AI Tools",
    issuer: "Coursera",
    issued: "Oct 2025",
    img: "https://s3.amazonaws.com/coursera_assets/meta_images/generated/CERTIFICATE_LANDING_PAGE/CERTIFICATE_LANDING_PAGE~I1S0QDJU8YPY/CERTIFICATE_LANDING_PAGE~I1S0QDJU8YPY.jpeg",
    link: "https://www.coursera.org/account/accomplishments/verify/I1S0QDJU8YPY?utm_source=img&utm_medium=certificate&utm_content=cert_image&utm_campaign=pdf_header_button&utm_product=course"
  },
  {
    title: "Discover the Art of Prompting",
    issuer: "Coursera",
    issued: "Oct 2025",
    img: "https://s3.amazonaws.com/coursera_assets/meta_images/generated/CERTIFICATE_LANDING_PAGE/CERTIFICATE_LANDING_PAGE~02BUVU4B9I9D/CERTIFICATE_LANDING_PAGE~02BUVU4B9I9D.jpeg",
    link: "https://www.coursera.org/account/accomplishments/verify/02BUVU4B9I9D?utm_source=link&utm_medium=certificate&utm_content=cert_image&utm_campaign=sharing_cta&utm_product=course"
  },
  {
    title: "Use AI Responsibly",
    issuer: "Coursera",
    issued: "Oct 2025",
    link: "https://www.coursera.org/account/accomplishments/verify/MR9ZLDZSAP4V?utm_source=link&utm_medium=certificate&utm_content=cert_image&utm_campaign=sharing_cta&utm_product=course",
    img: "https://s3.amazonaws.com/coursera_assets/meta_images/generated/CERTIFICATE_LANDING_PAGE/CERTIFICATE_LANDING_PAGE~02BUVU4B9I9D/CERTIFICATE_LANDING_PAGE~02BUVU4B9I9D.jpeg"
  },
  {
    title: "J'pura Xtream 2025",
    issuer: "IEEE Student Branch - University of Sri Jayewardenepura",
    issued: "Oct 2025",
    img: "https://github.com/nngeek195/Portfilio/blob/main/Images/jpura.png?raw=true"
  },
  {
    title: "AI Buildathon",
    issuer: "IEEE Computer Society of KDU",
    issued: "Oct 2025",
    img: "https://github.com/nngeek195/Portfilio/blob/main/Images/Tensorforge.png?raw=true"
  },
  {
    title: "Networking Basics",
    issuer: "Cisco Networking Academy",
    issued: "Jan 2025",
    link: "https://www.credly.com/badges/46b2283d-4e9e-4eb4-a797-85e0a975dd99/public_url",
    img: "https://images.credly.com/size/680x680/images/5bdd6a39-3e03-4444-9510-ecff80c9ce79/image.png"
  },
  {
    title: "SQL Injection",
    issuer: "Simplilearn",
    issued: "Dec 2024",
    link: "https://www.simplilearn.com/skillup-certificate-landing?token=eyJjb3Vyc2VfaWQiOiIyNDM3IiwiY2VydGlmaWNhdGVfdXJsIjoiaHR0cHM6XC9cL2NlcnRpZmljYXRlcy5zaW1wbGljZG4ubmV0XC9zaGFyZVwvNzY3NTM5OV83ODE1NjMwMTczNDM0Njk3NjQxMS5wbmciLCJ1c2VybmFtZSI6Ik5pcmFuZ2EgTmF5YW5haml0aCJ9&utm_source=shared-certificate&utm_medium=lms&utm_campaign=shared-certificate-promotion&referrer=https%3A%2F%2Flms.simplilearn.com%2Fcourses%2F5141%2FSQL-Injection-For-Beginners%2Fcertificate%2Fdownload-skillup&%24web_only=true",
    img: "https://certificates.simplicdn.net/share/7675399_78156301734346976411.png"
  },
  {
    title: "Ethical Hacking - Mobile Platforms and Network Architecture",
    issuer: "Great Learning",
    issued: "Nov 2024",
    link: "https://www.mygreatlearning.com/certificate/AVUFKFYY",
    img: "https://d9jmtjs5r4cgq.cloudfront.net/ComplementaryCourseCertificate/5731008/original/K.H.A.Niranga_Nayanajith20241124-72-15z1wm.jpg"
  },
  {
    title: "Innovate with Ballerina Coding Challenge",
    issuer: "WSO2",
    issued: "Nov 2024",
    link: "https://certificates.ballerina.io/IWB24P-sRi3bCQYAy",
    img: "https://github.com/nngeek195/Portfilio/blob/main/Images/qq.jpg?raw=true"
  },
  {
    title: "Introduction to Cyber Crime",
    issuer: "Great Learning",
    issued: "Nov 2024",
    link: "https://www.mygreatlearning.com/certificate/PGAZALGR",
    img: "https://github.com/nngeek195/Portfilio/blob/main/Images/cyber_crime.jpg?raw=true"
  },
  {
    title: "Introduction to Cyber Security",
    issuer: "Great Learning",
    issued: "Nov 2024",
    link: "https://www.mygreatlearning.com/certificate/OFTDRZTK",
    img: "https://d9jmtjs5r4cgq.cloudfront.net/ComplementaryCourseCertificate/5697763/original/K.H.A.Niranga_Nayanajith20241119-74-qqnrvz.jpg"
  },
  {
    title: "Introduction to Ethical Hacking",
    issuer: "Great Learning",
    issued: "Nov 2024",
    link: "https://www.mygreatlearning.com/certificate/FPPLCLCG",
    img: "https://d9jmtjs5r4cgq.cloudfront.net/ComplementaryCourseCertificate/5726561/original/K.H.A.Niranga_Nayanajith20241123-73-1f7cdxy.jpg"
  },
  {
    title: "MoraXtreame Hackerthon",
    issuer: "IEEE Student Branch University of Moratuwa",
    issued: "Nov 2024",
    link: "https://drive.google.com/file/d/1WXikJOCaKOf7FNVSX-HtMmynb2PVF1NX/view",
    img: "https://github.com/nngeek195/Portfilio/blob/main/Images/q.jpg?raw=true"
  },
  {
    title: "Introduction to Programming Using Python",
    issuer: "Kaggle",
    issued: "Aug 2024",
    link: "https://www.kaggle.com/learn/certification/nngeek/python",
    img: "https://github.com/nngeek195/Portfilio/blob/main/Images/ss.png?raw=true"
  },
  {
    title: "Responsive Web Design",
    issuer: "freeCodeCamp",
    issued: "Aug 2024",
    link: "https://freecodecamp.org/certification/fcc4441a823-f4dd-41a2-882a-0deefbb51731/responsive-web-design",
    img: "https://github.com/nngeek195/Portfilio/blob/main/Images/fre.jpeg?raw=true"
  },
  {
    title: "Basic In Python",
    issuer: "HackerRank",
    issued: "Jun 2024",
    link: "https://www.hackerrank.com/certificates/iframe/705d0f988340",
    img: "https://github.com/nngeek195/Portfilio/blob/main/Images/me.jpg?raw=true"
  },
  {
    title: "Introduction to Programming",
    issuer: "Kaggle",
    issued: "",
    link: "https://www.kaggle.com/learn/certification/nngeek/intro-to-programming",
    img: "https://github.com/nngeek195/Portfilio/blob/main/Images/we.png?raw=true"
  }
];

// Normalize into the same shape Firestore certificates use (mediaUrls, dateIssued,
// credentialUrl), and give every entry a stable, unique id — this is what was
// missing and caused the "unique key prop" warning.
const hardcodedCertificates = hardcodedCertificatesRaw.map((c, idx) => ({
  id: `hardcoded-${slugify(c.title)}-${idx}`,
  title: c.title,
  issuer: c.issuer,
  dateIssued: c.issued || '',
  credentialUrl: c.link || null,
  mediaUrls: c.img ? [c.img] : [],
}));

// Shows a spinner while a certificate image loads, and falls back to the
// placeholder (then a plain icon) instead of a broken-image icon on failure.
const CERT_PLACEHOLDER = '/Images/cert-placeholder.jpg';

function CertImage({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src || CERT_PLACEHOLDER);

  useEffect(() => {
    setStatus('loading');
    setCurrentSrc(src || CERT_PLACEHOLDER);
  }, [src]);

  const handleError = () => {
    if (currentSrc !== CERT_PLACEHOLDER) {
      // First failure: try the local placeholder instead.
      setStatus('loading');
      setCurrentSrc(CERT_PLACEHOLDER);
    } else {
      // Placeholder itself failed too — give up gracefully with an icon.
      setStatus('error');
    }
  };

  // <img> can never render a PDF file — that's not a network/loading issue,
  // it's the wrong tag for the file type. Show a badge instead of trying
  // (and instead of falling through to the broken-image/placeholder path).
  const isPdf = !!src && src.toLowerCase().split('?')[0].endsWith('.pdf');
  if (isPdf) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-cyan-400">
        <FileText size={32} />
        <span className="text-[10px] font-bold uppercase tracking-wide">PDF</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-600">
        <Award size={40} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {status === 'loading' && (
        <Loader2 className="absolute animate-spin text-cyan-400" size={24} />
      )}
      <img
        src={currentSrc}
        alt={alt}
        onLoad={() => setStatus('loaded')}
        onError={handleError}
        className={`max-w-full max-h-full object-contain group-hover:scale-110 transition-all duration-300 ${
          status === 'loading' ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}

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

function ChatWidget() {
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
    } catch (error: any) {
      setMessages((prev) => [...prev, { sender: 'bot', text: `Error: ${error.message}`, isError: true }]);
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

export default function LandingPage() {
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(5);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState(true);

  // Fetch real Certificates from Firebase
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const q = query(collection(db, 'curated_content'), where('category', '==', 'certificate'));
        const querySnapshot = await getDocs(q);
        
        const fetchedCerts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCertificates(fetchedCerts);
      } catch (error) {
        console.error("Error fetching certificates from Firebase:", error);
      } finally {
        setIsLoadingCerts(false);
      }
    };

    fetchCertificates();
  }, []);
  // 1. Fetch images and timer speed from Firebase
  useEffect(() => {
    const fetchHeroSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'profile');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.profileImages && data.profileImages.length > 0) {
            setProfileImages(data.profileImages);
          } else {
            setProfileImages(['/Images/2.jpg']); // Fallback if empty
          }
          if (data.intervalSeconds) {
            setIntervalSeconds(data.intervalSeconds);
          }
        } else {
          setProfileImages(['/Images/2.jpg']); // Fallback if no doc exists
        }
      } catch (error) {
        console.error("Failed to load profile images:", error);
        setProfileImages(['/Images/2.jpg']);
      }
    };
    fetchHeroSettings();
  }, []);

  // 2. Auto-rotate images based on the fetched timer speed
  useEffect(() => {
    if (profileImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImgIndex((prev) => (prev + 1) % profileImages.length);
      }, intervalSeconds * 1000); // Multiply by 1000 to convert seconds to ms
      
      return () => clearInterval(interval);
    }
  }, [profileImages, intervalSeconds]);

  // Clicking a certificate opens its source link in a new tab if one exists.
  // If there's no link, the card is inert — no popup, no modal.
  const handleCertClick = (cert: any) => {
    const url = cert.credentialUrl || cert.link;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-black text-slate-300 font-sans selection:bg-cyan-500/30">
      
      {/* --- HEADER NAVIGATION --- */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-cyan-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Niranga Nayanajith
          </Link>
          <nav className="hidden md:flex gap-8 font-semibold text-slate-300">
            <a href="#about" className="hover:text-cyan-400 transition-colors">About</a>
            <a href="#skills" className="hover:text-cyan-400 transition-colors">Skills</a>
            <Link href="/articles" className="hover:text-cyan-400 transition-colors">Articles</Link>
            <Link href="/projects" className="hover:text-cyan-400 transition-colors">Projects</Link>
            <a href="#contact" className="hover:text-cyan-400 transition-colors">Contact</a>
          </nav>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden text-slate-200 hover:text-cyan-400 transition-colors p-1"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile nav panel */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-cyan-900/50 bg-black/95 backdrop-blur-md ${
            mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="flex flex-col px-6 py-4 gap-1 font-semibold text-slate-300">
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="py-3 border-b border-gray-900 hover:text-cyan-400 transition-colors">About</a>
            <a href="#skills" onClick={() => setMobileMenuOpen(false)} className="py-3 border-b border-gray-900 hover:text-cyan-400 transition-colors">Skills</a>
            <Link href="/articles" onClick={() => setMobileMenuOpen(false)} className="py-3 border-b border-gray-900 hover:text-cyan-400 transition-colors">Articles</Link>
            <Link href="/projects" onClick={() => setMobileMenuOpen(false)} className="py-3 border-b border-gray-900 hover:text-cyan-400 transition-colors">Projects</Link>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="py-3 hover:text-cyan-400 transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden pt-16">
        <object 
          data="https://cdn.svgator.com/images/2021/10/solar-system-animation-1.svg" 
          type="image/svg+xml"
          className="absolute inset-0 w-full h-full opacity-20 mix-blend-screen pointer-events-none -z-10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black -z-10"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight tracking-tight mb-6">
            Hello, I'm <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-pulse">
              Niranga Nayanajith
            </span>
          </h1>
          <p className="text-xl md:text-3xl text-slate-400 font-medium mb-6">
            A Developer & Cybersecurity Enthusiast
          </p>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
            I am currently an undergraduate at the Faculty of Computing, Sabaragamuwa University of Sri Lanka, with a passion for building innovative software and exploring the depths of cybersecurity.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/projects" className="bg-cyan-600 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-full transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105">
              View My Projects
            </Link>
            <a href="#contact" className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-full transition-all border border-gray-700">
              Get In Touch
            </a>
          </div>
        </div>
      </section>

      {/* --- ABOUT & IMAGE SHOWCASE SECTION --- */}
      <section id="about" className="relative py-24 px-6 md:px-20 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="md:w-1/2 space-y-6">
            <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              About Me
            </h2>
            <p className="leading-relaxed text-lg text-slate-300">
              I am a dedicated and results-driven undergraduate student. My academic journey has equipped me with a strong foundation in computer science principles.
            </p>
            <p className="leading-relaxed text-lg text-slate-300">
              As a <span className="font-semibold text-cyan-400">developer</span>, I specialize in creating robust and efficient software solutions. My skills include front-end and back-end development. As a <span className="font-semibold text-cyan-400">cybersecurity enthusiast</span>, I have a keen interest in network security, ethical hacking, and data protection, continuously working to understand and defend against digital threats.
            </p>
          </div>
          {/* Dynamic Image Showcase */}
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-full border-4 border-cyan-500 shadow-[0_0_40px_rgba(0,255,234,0.3)] overflow-hidden group">
              
              {/* Stack all images and crossfade using opacity */}
              {profileImages.map((src, index) => (
                <img 
                  key={src} // Use the URL as the key
                  src={src} 
                  alt={`Profile Showcase ${index + 1}`} 
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out group-hover:scale-110
                    ${index === currentImgIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}
                  `}
                />
              ))}

              {/* Indicators for multiple images */}
              {profileImages.length > 1 && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
                  {profileImages.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`w-2 h-2 rounded-full transition-all duration-500 ${idx === currentImgIndex ? 'bg-cyan-400 w-4 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-gray-500/80'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- LANGUAGES & TECHNOLOGIES SECTION --- */}
      <section id="skills" className="py-24 px-6 md:px-20 bg-black">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-16">
            Languages & Technologies
          </h2>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Python', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/python/python-original.svg' },
              { name: 'JavaScript', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg' },
              { name: 'Node.js', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original-wordmark.svg' },
              { name: 'React', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg' },
              { name: 'Next.js', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/nextjs/nextjs-original.svg' },
              { name: 'C#', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/csharp/csharp-original.svg' },
              { name: '.NET', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/dotnetcore/dotnetcore-plain.svg' },
              { name: 'Java', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/java/java-original.svg' },
              { name: 'Linux', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/linux/linux-original.svg' },
              { name: 'Git', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/git/git-original.svg' },
              { name: 'MongoDB', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/mongodb/mongodb-original.svg' },
              { name: 'PostgreSQL', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original.svg' },
              { name: 'SQLite', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/sqlite/sqlite-original.svg' },
              { name: 'Firebase', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/firebase/firebase-plain.svg' },
              { name: 'AWS', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
              { name: 'Azure', src: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/azure/azure-original.svg' },
              { name: 'Alibaba Cloud', src: 'https://cdn.simpleicons.org/alibabacloud/FF6A00' },
              { name: 'n8n', src: 'https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light/n8n-color.png' },
            ].map((tech) => (
              <div 
                key={tech.name} 
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-900 rounded-2xl flex items-center justify-center p-3 sm:p-4 border border-gray-800 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:-translate-y-2 transition-all cursor-pointer group"
                title={tech.name}
              >
                <img 
                  src={tech.src} 
                  alt={tech.name} 
                  loading="lazy"
                  className="w-full h-full object-contain filter group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SHOWCASE DIRECTORY (GIFs) --- */}
      <section className="py-24 px-6 md:px-20 bg-gray-950 border-y border-gray-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
          
          <Link href="/articles" className="group flex flex-col items-center p-8 bg-black border border-gray-800 rounded-2xl hover:border-cyan-500 transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
            <div className="w-full h-64 md:h-80 overflow-hidden rounded-xl mb-6">
              <img 
                src="https://raw.githubusercontent.com/nngeek195/Hutchrefresher/refs/heads/main/AI%20Robot%20presenting%20news%20report%20digital%20media%20automation%20technology%20global%20communication%20(1).gif" 
                alt="Articles" 
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" 
              />
            </div>
            <h3 className="text-2xl font-bold text-cyan-400 group-hover:text-cyan-300">Visit for articles</h3>
          </Link>

          <Link href="/projects" className="group flex flex-col items-center p-8 bg-black border border-gray-800 rounded-2xl hover:border-cyan-500 transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
            <div className="w-full h-64 md:h-80 overflow-hidden rounded-xl mb-6">
              <img 
                src="https://raw.githubusercontent.com/nngeek195/Hutchrefresher/refs/heads/main/Project%20Management%20(1).gif" 
                alt="Projects" 
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" 
              />
            </div>
            <h3 className="text-2xl font-bold text-cyan-400 group-hover:text-cyan-300">Visit project showcase</h3>
          </Link>

        </div>
      </section>

      {/* --- CERTIFICATES SECTION --- */}
      <section className="py-24 px-6 md:px-20 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-16">
            Curated Certificates
          </h2>
          
          {isLoadingCerts ? (
            <div className="flex justify-center items-center h-32 text-cyan-400">
              <Loader2 className="animate-spin mr-3" size={32} /> Loading Certificates...
            </div>
          ) : (() => {
            // Hardcoded certs always show; Firestore ones append once loaded.
            const displayCertificates = [...hardcodedCertificates, ...certificates];
            return displayCertificates.length === 0 ? (
              <div className="text-slate-400 text-center py-10">
                No certificates published yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayCertificates.map(cert => {
                  const hasLink = !!(cert.credentialUrl || cert.link);
                  return (
                    <div 
                      key={cert.id} 
                      onClick={() => handleCertClick(cert)}
                      className={`bg-gray-900 border border-gray-800 p-8 rounded-xl transition-all flex flex-col items-center text-center group ${
                        hasLink
                          ? 'hover:border-cyan-500 cursor-pointer hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                          : 'cursor-default'
                      }`}
                    >
                      <div className="w-32 h-32 mb-6 bg-white/10 rounded-lg p-2 flex items-center justify-center overflow-hidden">
                        <CertImage 
                          src={cert.mediaUrls && cert.mediaUrls.length > 0 ? cert.mediaUrls[0] : CERT_PLACEHOLDER} 
                          alt={cert.title} 
                        />
                      </div>
                      <h3 className="text-xl font-bold text-slate-200 mb-2">{cert.title}</h3>
                      <p className="text-cyan-600 font-medium">{cert.issuer || 'Certification'}</p>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section id="contact" className="py-24 px-6 md:px-20 bg-gradient-to-t from-gray-900 to-black">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-8">
              Connect With Me
            </h2>
            <p className="text-lg text-slate-400 mb-10 max-w-md">
              Feel free to reach out to me on any of the platforms below. I'm always open to new opportunities, collaborations, or just a friendly chat!
            </p>
            <ul className="space-y-6">
              <li>
                <a href="https://www.linkedin.com/in/niranga-nayanajith-548a0a302" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-xl font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                  <span className="p-3 bg-cyan-950 rounded-lg"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/linkedin/linkedin-original.svg" className="w-8 h-8"/></span>
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="https://github.com/nngeek195" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-xl font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                  <span className="p-3 bg-cyan-950 rounded-lg"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/github/github-original.svg" className="w-8 h-8 bg-white rounded-full"/></span>
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div className="lg:w-1/2 flex justify-center">
             <object
                data="https://cdn.svgator.com/images/2021/10/Robot-morph-icon.svg"
                type="image/svg+xml"
                className="w-full max-w-md"
             />
          </div>
        </div>
      </section>

      {/* --- DIGITAL TWIN CHATBOT --- */}
      <ChatWidget />

    </div>
  );
}