'use client';

import { useEffect, useRef } from 'react';

// Crosshair cursor for desktop mouse users only ((hover: hover) and (pointer: fine),
// and only once a real mouse has moved: touch, pen and keyboard users never see it).
// Lock-on brackets snap around the button or link under the pointer.
// Text fields and the chat keep the native cursor (the crosshair hides there);
// see the "Crosshair cursor" rules in app/globals.css.

const MEDIA = '(hover: hover) and (pointer: fine)';
const ATTR = 'data-crosshair';
const TARGETS = 'a[href], button:not(:disabled), [role="button"], summary, label[for]';
const NATIVE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-native-cursor]';
const PAD = 6; // bracket clearance around a locked target (px)
const IDLE = 8; // bracket box size when nothing is locked (px)

export default function CrosshairCursor() {
  const cross = useRef<HTMLDivElement>(null);
  const brackets = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia(MEDIA);
    const root = document.documentElement;
    let enabled = false;
    let raf = 0;
    let x = -100;
    let y = -100;
    let target: Element | null = null;
    let native = false;
    let shown = false;

    const draw = () => {
      raf = 0;
      const c = cross.current;
      const b = brackets.current;
      if (!c || !b) return;
      c.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      c.dataset.state = !shown || native ? 'hidden' : target ? 'locked' : 'free';
      if (shown && !native && target?.isConnected) {
        const r = target.getBoundingClientRect();
        b.style.transform = `translate3d(${r.left - PAD}px, ${r.top - PAD}px, 0)`;
        b.style.width = `${r.width + PAD * 2}px`;
        b.style.height = `${r.height + PAD * 2}px`;
        b.dataset.state = 'locked';
        raf = requestAnimationFrame(draw); // follow the target while the page scrolls under it
      } else {
        b.style.transform = `translate3d(${x - IDLE / 2}px, ${y - IDLE / 2}px, 0)`;
        b.style.width = b.style.height = `${IDLE}px`;
        b.dataset.state = 'free';
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') {
        // Touch or pen on a hybrid device: back to the native cursor until the mouse moves again.
        if (shown) {
          shown = false;
          root.removeAttribute(ATTR);
          schedule();
        }
        return;
      }
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        shown = true;
        root.setAttribute(ATTR, '');
      }
      const el = e.target instanceof Element ? e.target : null;
      native = !!el?.closest(NATIVE);
      target = native ? null : (el?.closest(TARGETS) ?? null);
      schedule();
    };
    const onLeave = () => {
      shown = false;
      target = null;
      schedule();
    };
    const onEnter = (e: PointerEvent) => e.pointerType === 'mouse' && onMove(e);

    const enable = () => {
      if (enabled) return;
      enabled = true;
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onMove, { passive: true });
      root.addEventListener('pointerleave', onLeave);
      root.addEventListener('pointerenter', onEnter);
    };
    const disable = () => {
      if (!enabled) return;
      enabled = false;
      shown = false;
      target = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerenter', onEnter);
      root.removeAttribute(ATTR);
      schedule();
    };
    const sync = () => (mq.matches ? enable() : disable());
    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      disable();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="crosshair-layer">
      <div ref={brackets} className="crosshair-brackets" data-state="free">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div ref={cross} className="crosshair" data-state="hidden">
        <svg viewBox="-16 -16 32 32" width="32" height="32">
          <g className="crosshair-ticks">
            <path d="M0 -13 V-5 M0 5 V13 M-13 0 H-5 M5 0 H13" />
          </g>
          <circle r="1.6" className="crosshair-dot" />
        </svg>
      </div>
    </div>
  );
}
