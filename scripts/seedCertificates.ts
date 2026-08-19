// scripts/seedCertificates.ts
//
// One-off script: pushes everything in certificates-seed.ts into Firestore
// (curated_content, category: 'certificate'). Run it once after filling in
// the seed file, e.g.:
//
//   npx tsx scripts/seedCertificates.ts
//
// After this initial batch, add new certificates through the
// /admin/dashboard/certificates portal instead of editing this file again.

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { certificatesSeed } from '../lib/certificates-seed';

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildDescriptionHtml(issuer?: string, dateIssued?: string, credentialUrl?: string, notes?: string) {
  const metaLines: string[] = [];
  if (issuer) metaLines.push(`<p class="mb-1"><strong>Issued by:</strong> ${escapeHtml(issuer)}</p>`);
  if (dateIssued) metaLines.push(`<p class="mb-1"><strong>Date:</strong> ${escapeHtml(dateIssued)}</p>`);
  if (credentialUrl) {
    metaLines.push(
      `<p class="mb-1"><strong>Credential:</strong> <a href="${credentialUrl}" target="_blank" rel="noopener noreferrer" class="text-cyan-400 underline">${escapeHtml(credentialUrl)}</a></p>`
    );
  }
  const metaHtml = metaLines.length ? `<div class="mb-4 text-sm text-slate-400">${metaLines.join('')}</div>` : '';
  const bodyHtml = notes ? notes.split('\n').filter(Boolean).map((line) => `<p class="mb-2">${escapeHtml(line)}</p>`).join('') : '';
  return metaHtml + bodyHtml;
}

async function main() {
  for (const cert of certificatesSeed) {
    const docData = {
      id: cert.id,
      title: cert.title,
      description: buildDescriptionHtml(cert.issuer, cert.dateIssued, cert.credentialUrl, cert.notes),
      mediaUrls: [cert.imageUrl],
      credentialUrl: cert.credentialUrl || null,
      issuer: cert.issuer || null,
      dateIssued: cert.dateIssued || null,
      category: 'certificate',
      publishedAt: cert.dateIssued ? new Date(cert.dateIssued).toISOString() : new Date().toISOString(),
    };
    await setDoc(doc(db, 'curated_content', cert.id), docData);
    console.log(`Seeded certificate: ${cert.title}`);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});