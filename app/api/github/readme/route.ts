import { NextResponse, type NextRequest } from 'next/server';
import { getAdminSession } from '@/lib/admin-session';
import { getProjects } from '@/lib/content';

// GitHub repository names: letters, digits, '.', '-', '_' (max 100).
const REPO_NAME = /^(?!\.{1,2}$)[A-Za-z0-9._-]{1,100}$/;
// GitHub owners (users / organisations): letters, digits, single hyphens (max 39).
const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
// Default owner for the admin preview of an unpublished repo (Importers > GitHub tab lists these).
const DEFAULT_OWNER = 'nngeek195';

/** owner/repo from a stored repoUrl such as https://github.com/CV-net-Org/cvnet-frontend(.git)(/…). */
function parseRepoUrl(url: unknown): { owner: string; repo: string } | null {
  if (typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    if (u.hostname !== 'github.com' && u.hostname !== 'www.github.com') return null;
    const [owner, rawRepo] = u.pathname.split('/').filter(Boolean);
    const repo = rawRepo?.replace(/\.git$/i, '');
    return owner && repo && OWNER.test(owner) && REPO_NAME.test(repo) ? { owner, repo } : null;
  } catch {
    return null;
  }
}

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

// Public (used by the project popup on the site): only READMEs of projects
// published in Firestore. A signed-in admin may also preview any repo
// (Importers > GitHub tab, before a repo is published).
//
// `repo` is what the popup sends (the stored repoName); `owner/repo` is also
// accepted. A published project is matched by its repoName or by the repo in
// its repoUrl (case-insensitive), and the README is read from the owner in its
// repoUrl (some projects live under another user or an organisation).
export async function GET(request: NextRequest) {
  const param = new URL(request.url).searchParams.get('repo')?.trim();
  if (!param) return json({ error: 'Repository name required' }, 400);

  const [first, second, extra] = param.split('/');
  const askedOwner = second !== undefined ? first : null;
  const askedRepo = second !== undefined ? second : first;
  if (extra !== undefined || !REPO_NAME.test(askedRepo) || (askedOwner !== null && !OWNER.test(askedOwner))) {
    return json({ error: 'Invalid repository name' }, 400);
  }

  const name = askedRepo.toLowerCase();
  const published = (await getProjects()).find((p) => {
    const fromUrl = parseRepoUrl(p.repoUrl);
    const sameRepo = String(p.repoName ?? '').toLowerCase() === name || fromUrl?.repo.toLowerCase() === name;
    return sameRepo && (askedOwner === null || fromUrl?.owner.toLowerCase() === askedOwner.toLowerCase());
  });

  let owner: string;
  let repo: string;
  if (published) {
    const fromUrl = parseRepoUrl(published.repoUrl);
    owner = fromUrl?.owner ?? DEFAULT_OWNER;
    repo = fromUrl?.repo ?? askedRepo;
  } else {
    // Unpublished: blocked for the public, previewable by a signed-in admin.
    if (!(await getAdminSession(request))) return json({ error: 'README not available for this repository' }, 404);
    owner = askedOwner ?? DEFAULT_OWNER;
    repo = askedRepo;
  }
  const repoUrl = `https://github.com/${owner}/${repo}`;

  const token = process.env.GITHUB_ACCESS_TOKEN;
  let response: Response;
  try {
    response = await fetch(`https://api.github.com/repos/${owner}/${encodeURIComponent(repo)}/readme`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Asks GitHub to render the Markdown to HTML.
        Accept: 'application/vnd.github.html',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error('GitHub README fetch failed (network):', owner, repo, error instanceof Error ? error.message : error);
    return json({ error: 'GitHub could not be reached right now. Try again shortly, or open the repository on GitHub.', repoUrl }, 502);
  }

  if (response.ok) return json({ html: await response.text(), repoUrl });

  // Same shape as before for a missing README (the admin preview shows `html`).
  if (response.status === 404) {
    return json({ html: '<p>No README found for this repository.</p>', notFound: true, repoUrl });
  }
  const rateLimited = (response.status === 403 || response.status === 429) && response.headers.get('x-ratelimit-remaining') === '0';
  const reset = Number(response.headers.get('x-ratelimit-reset'));
  console.error('GitHub README fetch failed:', owner, repo, response.status, rateLimited ? '(rate limited)' : '');
  const error =
    response.status === 401
      ? 'GitHub rejected the server’s access token, so the README can’t be loaded right now.'
      : rateLimited
        ? `GitHub’s rate limit was reached${reset ? `; it resets at ${new Date(reset * 1000).toUTCString().slice(17, 22)} UTC` : ''}.`
        : response.status === 403
          ? 'GitHub refused access to this repository’s README.'
          : `GitHub responded with an error (${response.status}).`;
  return json({ error, repoUrl }, 502);
}
