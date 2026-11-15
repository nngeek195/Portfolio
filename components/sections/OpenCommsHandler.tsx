'use client';

import { Radio } from 'lucide-react';
import { OPEN_COMMS_EVENT } from '@/components/home/ChatWidget';

// Comms channel that opens the AI chat ("Comms Handler") widget.
export default function OpenCommsHandler({ className }: { className: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COMMS_EVENT))} className={className}>
      <span className="font-mono text-xs text-nv">CH-04</span>
      <span>
        <span className="block font-display text-2xl font-bold uppercase tracking-wide text-bone">Comms handler</span>
        <span className="block text-sm text-ash">AI digital twin: ask about my background</span>
      </span>
      <Radio size={26} className="text-nv" aria-hidden="true" />
    </button>
  );
}
