import { NextResponse } from 'next/server';

export async function GET() {
  const LINKEDIN_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
  const PERSON_URN = process.env.LINKEDIN_PERSON_URN; // e.g., urn:li:person:12345XYZ

  if (!LINKEDIN_TOKEN || !PERSON_URN) {
    return NextResponse.json({ error: 'LinkedIn token or URN not configured' }, { status: 500 });
  }

  try {
    // LinkedIn's UGC (User Generated Content) API endpoint
    const response = await fetch(`https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(${encodeURIComponent(PERSON_URN)})&count=20`, {
      headers: {
        Authorization: `Bearer ${LINKEDIN_TOKEN}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      next: { revalidate: 3600 } // Cache the response for 1 hour
    });

    if (!response.ok) {
      throw new Error(`LinkedIn API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Map LinkedIn's highly nested raw data into a clean format for our Admin UI
    const formattedPosts = data.elements.map((post: any) => {
      // Extract text content safely
      const textContent = post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || 'No description available';
      
      // Attempt to extract images if they exist in the media assets
      const mediaElements = post.specificContent?.['com.linkedin.ugc.ShareContent']?.media || [];
      const mediaUrls = mediaElements.map((media: any) => {
        return media.originalUrl || media.thumbnails?.[0]?.url || '/Images/article-ph.jpg'; // Fallback to placeholder
      });

      // We use the first 50 characters as a generated title since LinkedIn posts don't technically have "titles"
      const generatedTitle = textContent.length > 50 ? `${textContent.substring(0, 50)}...` : textContent;

      return {
        id: post.id, // e.g., urn:li:share:123456789
        title: generatedTitle,
        description: textContent,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : ['/Images/article-ph.jpg'],
        source: 'linkedin',
        publishedAt: post.created?.time || Date.now(),
      };
    });

    return NextResponse.json(formattedPosts);

  } catch (error) {
    console.error('LinkedIn Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch LinkedIn posts' }, { status: 500 });
  }
}