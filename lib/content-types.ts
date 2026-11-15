// Shape of documents in the Firestore `curated_content` collection.
// Documents are written by several admin importers, so every field except `id`
// is optional and unknown extra fields are allowed.
export type ContentItem = {
  id: string;
  category?: 'certificate' | 'project' | 'article';
  title?: string;
  repoName?: string;
  repoUrl?: string;
  description?: string;
  bannerImage?: string | null;
  mediaUrls?: string[];
  videoUrl?: string;
  pdfUrl?: string;
  sourceUrl?: string;
  publishedAt?: string;
  issuer?: string;
  dateIssued?: string;
  credentialUrl?: string | null;
  link?: string | null;
  [key: string]: unknown;
};
