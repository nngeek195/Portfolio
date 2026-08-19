import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch the URL');

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'No Title Found';
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';

    // Only treat this as a PDF if the pasted URL itself points directly to a .pdf file.
    // NOTE: We intentionally do NOT scan the page's <a> tags for ".pdf" links anymore.
    // LinkedIn document/carousel posts never expose a real PDF file URL in their public
    // HTML (the carousel is JS-rendered and requires auth), so that scan never found the
    // actual document there — it only risked grabbing an unrelated PDF link from a page's
    // footer/nav (e.g. a privacy policy) on other sites. LinkedIn document posts will now
    // just use their og:image thumbnail like any other image post.
    const pdfUrl = targetUrl.toLowerCase().endsWith('.pdf') ? targetUrl : null;

    const images: string[] = [];
    $('meta[property="og:image"]').each((_, el) => {
      const content = $(el).attr('content');
      if (content) images.push(content);
    });

    const videoUrl = $('meta[property="og:video:secure_url"]').attr('content') || $('meta[property="og:video"]').attr('content') || null;

    return NextResponse.json({
      title: title.trim(),
      description: description.trim(),
      mediaUrls: [...new Set(images)].slice(0, 5),
      videoUrl,
      pdfUrl, // <-- Captured PDF link
      sourceUrl: targetUrl
    });

  } catch (error) {
    console.error('Scraping Error:', error);
    return NextResponse.json({ error: 'Failed to scrape the provided URL' }, { status: 500 });
  }
}