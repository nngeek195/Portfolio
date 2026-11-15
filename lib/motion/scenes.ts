// Pinned, scroll-scrubbed scenes run only where they work well: motion allowed,
// a desktop-sized viewport (wide AND tall enough to fit a pinned scene).
// Everywhere else the sections keep their normal, unpinned layout.
export const SCENE_MEDIA = '(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 700px)';
