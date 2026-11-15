import CertificateGrid, { type CertificateCard } from '@/components/home/CertificateGrid';
import SectionHeader from '@/components/ui/SectionHeader';

// OBJ-06 Commendations (Certificates). Phase 2: cards reveal in staggered batches.
export default function Commendations({ certificates }: { certificates: CertificateCard[] }) {
  return (
    <section id="certificates" aria-labelledby="certificates-title" className="relative scroll-mt-16 border-t border-steel/60 bg-[#0a0c0e] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader id="certificates" kicker={`${certificates.length} certificates and competition awards. Cards with a Verify tag link to the issuer's credential page.`} />
        <ul data-reveal="up" className="mb-8 flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ash" aria-label="Ribbon legend">
          <li className="flex items-center gap-2"><span className="h-2 w-6 bg-amber" aria-hidden="true" /> Field op — hackathons &amp; challenges</li>
          <li className="flex items-center gap-2"><span className="h-2 w-6 bg-nv" aria-hidden="true" /> Vendor certification</li>
          <li className="flex items-center gap-2"><span className="h-2 w-6 bg-blueprint" aria-hidden="true" /> Training course</li>
        </ul>
        <CertificateGrid certificates={certificates} />
      </div>
    </section>
  );
}
