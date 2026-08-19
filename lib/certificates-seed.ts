// certificates-seed.ts
//
// Quick-start hardcoded certificate list. Fill this in with your existing
// certificates and run it once (see the seed script usage below) to push
// them into Firestore under the same `curated_content` collection your
// portal and public site already read from (category: 'certificate').
//
// After this, use the Certificates admin portal (/admin/dashboard/certificates)
// to add any new ones — you shouldn't need to touch this file again.

export interface CertificateSeed {
  id: string;            // unique, e.g. 'cert-aws-saa'
  title: string;
  issuer?: string;
  dateIssued?: string;   // 'YYYY-MM-DD'
  credentialUrl?: string;
  imageUrl: string;      // upload the certificate image/PDF to Cloudinary first, paste the secure_url here
  notes?: string;
}

export const certificatesSeed: CertificateSeed[] = [
  // Example — replace with your real certificates:
  // {
  //   id: 'cert-aws-saa',
  //   title: 'AWS Certified Solutions Architect – Associate',
  //   issuer: 'Amazon Web Services',
  //   dateIssued: '2025-03-14',
  //   credentialUrl: 'https://www.credly.com/badges/...',
  //   imageUrl: 'https://res.cloudinary.com/your-cloud/image/upload/v.../aws-saa.png',
  //   notes: 'Covers designing distributed systems on AWS.',
  // },
];