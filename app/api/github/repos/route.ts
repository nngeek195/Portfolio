import { NextResponse, type NextRequest } from 'next/server';
import { adminSessionRequired, getAdminSession } from '@/lib/admin-session';

// Admin-only: lists every repository the GitHub token can see (including
// private ones), so it requires a verified admin session.
export async function GET(request: NextRequest) {
  if (!(await getAdminSession(request))) return adminSessionRequired();

  const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  try {
    // GitHub caps every page at 100 results max, so `per_page=30` on its own
    // was silently truncating anyone with more than 30 repos. Loop through
    // pages until GitHub returns fewer than a full page (i.e. the last page).
    const allRepos: any[] = [];
    let page = 1;
    const PER_PAGE = 100;

    while (true) {
      const response = await fetch(
        `https://api.github.com/user/repos?sort=updated&per_page=${PER_PAGE}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
          // Next.js caching control: revalidate every hour or keep fresh
          next: { revalidate: 3600 },
        }
      );

      if (!response.ok) {
        const details = await response.text();

        console.error('GitHub API error:', {
          status: response.status,
          message: details,
          page,
        });

        throw new Error(
          `GitHub API responded with status: ${response.status}`
        );
      }

      const pageRepos = await response.json();
      allRepos.push(...pageRepos);

      // Fewer results than we asked for means this was the last page.
      if (pageRepos.length < PER_PAGE) break;

      page += 1;

      // Safety cap so a misbehaving API response can never loop forever.
      if (page > 20) break;
    }

    // Map the raw GitHub data into the clean format our frontend expects
    const formattedRepos = allRepos.map((repo: any) => ({
      id: `gh-${repo.id}`,
      repoName: repo.name,
      description: repo.description || 'No description provided.',
      repoUrl: repo.html_url,
      bannerImage: null, // Can be updated later via admin panel
      readmeHtml: null, // Can be fetched on demand later
      source: 'github',
    }));

    return NextResponse.json(formattedRepos);
  } catch (error) {
    console.error('GitHub Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch GitHub repositories' }, { status: 500 });
  }
}