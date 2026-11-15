'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ETA_SECONDS = 30;

/**
 * Comms HUD readout: "EXTRACTION INBOUND / ETA 00:30" counts down as the Comms
 * section scrolls into place (same range as the helicopter's landing), then
 * reads "LZ SECURE / ETA 00:00". Decorative (the panel is aria-hidden).
 */
export default function ExtractionEta() {
  const status = useRef<HTMLSpanElement>(null);
  const eta = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    let last = -1;
    const st = ScrollTrigger.create({
      trigger: '#contact',
      start: 'top bottom',
      end: 'center center',
      onUpdate: (self) => render(self.progress),
      onRefresh: (self) => render(self.progress),
    });
    function render(p: number) {
      const s = Math.max(0, Math.ceil(ETA_SECONDS * (1 - p)));
      if (s === last) return;
      last = s;
      if (eta.current) eta.current.textContent = `ETA 00:${String(s).padStart(2, '0')}`;
      if (status.current) status.current.textContent = s === 0 ? 'LZ secure' : 'Extraction inbound';
    }
    render(st.progress);
  });
  return (
    <>
      <span ref={status}>Extraction inbound</span>
      <span ref={eta}>ETA 00:30</span>
    </>
  );
}
