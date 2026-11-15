import 'server-only';
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { firebaseApp } from './firebase-app';
import type { ContentItem } from './content-types';

// Server-side reads for the public site. Pages call these at render time and
// cache the result through their `revalidate` route segment config, so content
// is in the HTML before any scroll animation measures the layout.

const db = getFirestore(firebaseApp);

export type { ContentItem };

export type ProfileSettings = {
  profileImages: string[];
  intervalSeconds: number;
};

// Shown when settings/profile has no images.
// PLACEHOLDER: profile-photo — replace by uploading photos in /admin/dashboard/media.
export const PROFILE_PLACEHOLDER = '/images/placeholders/profile.svg';

// Props passed to Client Components must be plain data. Dates are stored as ISO
// strings today, but convert any Firestore Timestamp defensively so a future
// field can't break rendering.
function toPlain(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(toPlain);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPlain(v)]));
}

async function getCategory(category: 'certificate' | 'project' | 'article'): Promise<ContentItem[]> {
  try {
    const snapshot = await getDocs(query(collection(db, 'curated_content'), where('category', '==', category)));
    return snapshot.docs.map((d) => ({ ...(toPlain(d.data()) as Omit<ContentItem, 'id'>), id: d.id }));
  } catch (error) {
    // Render the page without this content rather than failing the whole route.
    console.error(`Failed to load "${category}" content from Firestore:`, error);
    return [];
  }
}

export const getCertificates = () => getCategory('certificate');
export const getProjects = () => getCategory('project');

export async function getArticles(): Promise<ContentItem[]> {
  const articles = await getCategory('article');
  // Newest first.
  return articles.sort((a, b) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')));
}

export async function getProfileSettings(): Promise<ProfileSettings> {
  const fallback: ProfileSettings = { profileImages: [PROFILE_PLACEHOLDER], intervalSeconds: 5 };
  try {
    const snap = await getDoc(doc(db, 'settings', 'profile'));
    if (!snap.exists()) return fallback;
    const data = snap.data();
    return {
      profileImages: Array.isArray(data.profileImages) && data.profileImages.length > 0 ? data.profileImages : fallback.profileImages,
      intervalSeconds: typeof data.intervalSeconds === 'number' && data.intervalSeconds > 0 ? data.intervalSeconds : fallback.intervalSeconds,
    };
  } catch (error) {
    console.error('Failed to load profile settings from Firestore:', error);
    return fallback;
  }
}
