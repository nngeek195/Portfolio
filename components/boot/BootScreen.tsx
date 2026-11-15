import { PROFILE } from '@/lib/profile';

// "Establishing uplink" boot preloader. Server-rendered markup + CSS (see the
// "Boot preloader" section in app/globals.css): it is in the HTML, so it covers
// the page from the very first paint with no flash of the page behind it.
// The inline script below runs before first paint and decides whether it shows:
// first page load of the session, or ?preload=1. Without JavaScript it never
// shows (and a CSS failsafe hides it if the app scripts fail to load).
// BootController (client) drives progress and the exit.

export const BOOT_LINES = [
  { id: 'auth', label: 'AUTH OPERATOR' },
  { id: 'fonts', label: 'LOADING FONTS' },
  { id: 'nvg', label: 'NVG CALIBRATION' },
  { id: 'engine', label: 'RENDER ENGINE' },
  { id: 'assets', label: 'ASSET UPLINK' },
] as const;

export const BOOT_SEGMENTS = 20;

// Typing schedule (ms after first paint): line i starts at LINE_START + i * LINE_GAP.
const LINE_START = 450;
const LINE_GAP = 230;
const CHAR_MS = 18;

// Decides before first paint: show on the first load of a session or with ?preload=1;
// the simple version for reduced motion, small screens and FX: LITE (localStorage "fx").
// It also enforces the 4 s hard cap on its own: on a slow device the app may not
// have hydrated by then, and the site must show anyway (simple fade; the app
// takes over normally if it hydrates first, setting window.__bootCtl).
const INLINE = `(function(){try{var d=document.documentElement,q=new URLSearchParams(location.search),f=q.get('preload')==='1';if(f||!sessionStorage.getItem('boot:seen')){sessionStorage.setItem('boot:seen','1');d.setAttribute('data-boot','on');var m=window.matchMedia;if(m('(prefers-reduced-motion: reduce)').matches||!m('(min-width: 1024px) and (min-height: 600px)').matches||localStorage.getItem('fx')==='lite')d.setAttribute('data-boot-lite','');setTimeout(function(){if(d.getAttribute('data-boot')!=='on'||window.__bootCtl)return;window.__bootExitAt=performance.now();d.setAttribute('data-boot','exit');setTimeout(function(){d.setAttribute('data-boot','done');window.__bootDoneAt=performance.now();window.dispatchEvent(new Event('boot:done'))},450)},Math.max(0,4000-performance.now()))}}catch(e){}})();`;

function TypedLine({ index, label }: { index: number; label: string }) {
  const start = LINE_START + index * LINE_GAP;
  const text = `> ${label}`;
  const end = start + text.length * CHAR_MS;
  return (
    <li data-boot-line={BOOT_LINES[index].id} className="boot-li" style={{ '--end': `${end}ms` } as React.CSSProperties}>
      {Array.from(text, (ch, i) => (
        <span key={i} className="boot-ch" style={{ '--d': `${start + i * CHAR_MS}ms` } as React.CSSProperties}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
      <span className="boot-dots" style={{ '--d': `${end}ms` } as React.CSSProperties}>
        ...
      </span>
      <span className="boot-ok">OK</span>
    </li>
  );
}

export default function BootScreen() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INLINE }} />
      <div id="boot" className="boot">
        <div className="boot-visual" aria-hidden="true">
          {/* Eyelids: the two halves of the black screen; they slide apart on exit. */}
          <div className="boot-lid boot-lid-top" />
          <div className="boot-lid boot-lid-bottom" />
          {/* CRT line across the middle (becomes the eye slit on exit). */}
          <div className="boot-line" />

          <div className="boot-stage">
            {/* Corner HUD brackets */}
            <span className="boot-corner boot-corner-tl" />
            <span className="boot-corner boot-corner-tr" />
            <span className="boot-corner boot-corner-bl" />
            <span className="boot-corner boot-corner-br" />

            <div className="boot-hud boot-hud-tl">
              <span className="boot-rec">
                <span className="boot-rec-dot" /> REC
              </span>
              <span>
                CALLSIGN{' '}
                {PROFILE.callsign ? <span className="text-bone">{PROFILE.callsign}</span> : <span className="text-amber">[CALLSIGN]</span>}
              </span>
            </div>
            <div className="boot-hud boot-hud-tr">
              <span data-boot-time>--:--:--</span>
              <span>{PROFILE.location.utcOffset}</span>
            </div>
            <div className="boot-hud boot-hud-bl">
              {PROFILE.location.coords.split(' ').map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>

            {/* Terminal */}
            <ol className="boot-term">
              {BOOT_LINES.map((l, i) => (
                <TypedLine key={l.id} index={i} label={l.label} />
              ))}
            </ol>

            {/* Centre piece: radar with sweep, crosshair lock and spinning rotor */}
            <div className="boot-core">
              <div className="boot-radar">
                <svg viewBox="0 0 200 200" className="boot-radar-grid">
                  <circle cx="100" cy="100" r="98" />
                  <circle cx="100" cy="100" r="72" />
                  <circle cx="100" cy="100" r="46" />
                  <circle cx="100" cy="100" r="20" />
                  <path d="M100 2V198M2 100H198" />
                  {Array.from({ length: 36 }, (_, i) => (
                    <path key={i} d="M100 2V8" transform={`rotate(${i * 10} 100 100)`} className={i % 9 === 0 ? 'major' : ''} />
                  ))}
                </svg>
                <div className="boot-sweep" />
                <span className="boot-blip" style={{ left: '68%', top: '30%', '--b': '0.9s' } as React.CSSProperties} />
                <span className="boot-blip" style={{ left: '27%', top: '62%', '--b': '1.7s' } as React.CSSProperties} />
                <span className="boot-blip" style={{ left: '58%', top: '74%', '--b': '2.2s' } as React.CSSProperties} />
                <svg viewBox="0 0 200 200" className="boot-crosshair">
                  <path d="M100 40V78M100 122V160M40 100H78M122 100H160" />
                  <path d="M70 76V70H76M124 70H130V76M130 124V130H124M76 130H70V124" className="lock" />
                </svg>
                <svg viewBox="0 0 200 200" className="boot-rotor">
                  <circle cx="100" cy="100" r="34" className="disc" />
                  <g className="blades">
                    <rect x="64" y="97.5" width="72" height="5" rx="2.5" />
                    <rect x="97.5" y="64" width="5" height="72" rx="2.5" />
                  </g>
                  <circle cx="100" cy="100" r="5" className="hub" />
                </svg>
              </div>

              {/* Simple-version mark (shown instead of the radar in the lite version) */}
              <div className="boot-mark">NN</div>

              <div className="boot-readout">
                <span className="boot-pct">
                  <span data-boot-pct>00</span>
                  <span className="boot-pct-sign">%</span>
                </span>
                <span className="boot-label">
                  <span className="boot-label-loading">Establishing uplink</span>
                  <span className="boot-label-done">Uplink established</span>
                </span>
              </div>
              <div className="boot-bar">
                {Array.from({ length: BOOT_SEGMENTS }, (_, i) => (
                  <span key={i} data-boot-seg />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Screen readers: milestones only (not every percent). */}
        <p className="sr-only" role="status" aria-live="polite" data-boot-status>
          Loading the site.
        </p>
        <button type="button" className="boot-skip" data-boot-skip>
          Skip <span aria-hidden="true">[Esc]</span>
        </button>
      </div>
    </>
  );
}
