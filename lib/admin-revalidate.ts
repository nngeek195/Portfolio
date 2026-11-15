// Tells the server that admin content changed, so the public site refreshes
// its cached pages right away (see app/api/revalidate). Fire-and-forget: a
// failure never blocks or alters the admin action — the site still updates
// on its own within 5 minutes.
export function refreshLiveSite(): void {
  fetch('/api/revalidate', { method: 'POST', credentials: 'same-origin' })
    .then((res) => {
      if (!res.ok) console.warn(`Live site refresh skipped (${res.status}); it will update within 5 minutes.`);
    })
    .catch(() => console.warn('Live site refresh skipped (network); it will update within 5 minutes.'));
}
