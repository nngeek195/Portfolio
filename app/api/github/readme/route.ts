import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoName = searchParams.get('repo'); 

  if (!repoName) {
    return NextResponse.json({ error: 'Repository name required' }, { status: 400 });
  }

  const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
  // Make sure this matches your exact GitHub username
  const owner = "nngeek195"; 

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/readme`, {
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