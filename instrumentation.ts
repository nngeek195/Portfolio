// Runs once when the Next.js server starts (dev and `next start`).
//
// Outbound requests from the server (the image optimizer fetching Cloudinary /
// GitHub / Coursera images, the GitHub README API) use Node's built-in fetch,
// which ignores the HTTP(S)_PROXY environment variables. On a network where
// the internet is only reachable through a proxy, every one of those requests
// timed out: broken images through /_next/image (500/504) and "Failed to
// fetch README". Firestore kept working because its gRPC client does honour
// the proxy variables.
//
// When a proxy is configured, route fetch through it (NO_PROXY respected).
// Without proxy variables (e.g. a normal hosting provider) nothing changes.

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  if (!proxy) return;
  try {
    // undici is installed (cheerio depends on it); its global dispatcher is shared with Node's fetch.
    const { setGlobalDispatcher, EnvHttpProxyAgent } = await import('undici');
    setGlobalDispatcher(new EnvHttpProxyAgent());
    console.info('[server] Outbound fetch uses the HTTP(S)_PROXY from the environment.');
  } catch (error) {
    console.warn('[server] A proxy is configured but undici could not be loaded; outbound fetch stays direct.', error);
  }
}
