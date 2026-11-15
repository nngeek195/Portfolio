import { getArticles, getCertificates, getProfileSettings, getProjects } from '@/lib/content';
import { hardcodedCertificates } from '@/lib/certificates';
import { LOADOUT } from '@/lib/loadout';
import type { CertificateCard } from '@/components/home/CertificateGrid';
import ChatWidget from '@/components/home/ChatWidget';
import HudOverlay from '@/components/hud/HudOverlay';
import Hero from '@/components/sections/Hero';
import PersonnelFile from '@/components/sections/PersonnelFile';
import Loadout from '@/components/sections/Loadout';
import Operations from '@/components/sections/Operations';
import ServiceRecord from '@/components/sections/ServiceRecord';
import Commendations from '@/components/sections/Commendations';
import Comms from '@/components/sections/Comms';
import Debrief from '@/components/sections/Debrief';

// Re-read Firestore content at most every 5 minutes (ISR). Edits made in the
// admin dashboard show up on the live site within that window.
export const revalidate = 300;

// The home page is one mission: OBJ-01 Insertion → OBJ-08 Debrief.
export default async function HomePage() {
  const [firestoreCertificates, profile, projects, articles] = await Promise.all([
    getCertificates(),
    getProfileSettings(),
    getProjects(),
    getArticles(),
  ]);

  // Hardcoded certificates first, then the ones published from the admin portal.
  const certificates: CertificateCard[] = [
    ...hardcodedCertificates,
    ...firestoreCertificates.map((c) => ({ ...c, title: c.title || 'Untitled certificate' })),
  ];

  const stats = [
    { label: 'Operations filed', value: projects.length },
    { label: 'Commendations', value: certificates.length },
    { label: 'Intel reports', value: articles.length },
    { label: 'Skills loaded', value: LOADOUT.reduce((n, m) => n + m.skills.length, 0) },
  ];

  return (
    <>
      <Hero />
      <PersonnelFile profileImages={profile.profileImages} intervalSeconds={profile.intervalSeconds} />
      <Loadout />
      <Operations projects={projects} articles={articles} />
      <ServiceRecord />
      <Commendations certificates={certificates} />
      <Comms />
      <Debrief stats={stats} />
      <ChatWidget />
      <HudOverlay />
    </>
  );
}
