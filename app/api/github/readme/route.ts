import { NextResponse, type NextRequest } from 'next/server';
import { getAdminSession } from '@/lib/admin-session';
import { getProjects } from '@/lib/content';

// GitHub repository names: letters, digits, '.', '-', '_' (max 100).
const REPO_NAME = /^(?!\.{1,2}$)[A-Za-z0-9._-]{1,100}$/;

// Public (used by the project popup on the site): only READMEs of projects
// published in Firestore. A signed-in admin may also preview any repo
// (Importers > GitHub tab, before a repo is published).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoName = searchParams.get('repo'); 

  if (!repoName) {
    return NextResponse.json({ error: 'Repository name required' }, { status: 400 });
  }
  if (!REPO_NAME.test(repoName)) {
    return NextResponse.json({ error: 'Invalid repository name' }, { status: 400 });
  }
  if (!(await getAdminSession(request))) {
    const published = new Set((await getProjects()).map((p) => String(p.repoName ?? '').toLowerCase()));
    if (!published.has(repoName.toLowerCase())) {
      return NextResponse.json({ error: 'README not available for this repository' }, { status: 404 });
    }
  }

  const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
  // Make sure this matches your exact GitHub username
  const owner = "nngeek195"; 

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}/readme`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        // This specific Accept header tells GitHub to render the Markdown into HTML for us
        Accept: 'application/vnd.github.html', 
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ html: '<p>No README found for this repository.</p>' });
      }
      throw new Error(`GitHub API responded with status: ${response.status}`);
    }

    // Because we requested HTML, the response is plain text HTML
    const html = await response.text(); 
    return NextResponse.json({ html });

  } catch (error) {
    console.error('GitHub Readme Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch README' }, { status: 500 });
  }
}