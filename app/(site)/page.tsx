import Link from 'next/link';
import Image from 'next/image';
import { FileText, FolderGit2 } from 'lucide-react';
import { getCertificates, getProfileSettings } from '@/lib/content';
import { hardcodedCertificates } from '@/lib/certificates';
import ProfileShowcase from '@/components/home/ProfileShowcase';
import CertificateGrid, { type CertificateCard } from '@/components/home/CertificateGrid';
import ChatWidget from '@/components/home/ChatWidget';

// Re-read Firestore content at most every 5 minutes (ISR). Edits made in the
// admin dashboard show up on the live site within that window.
export const revalidate = 300;

// Self-hosted in public/icons/skills (previously hotlinked from GitHub/CDNs).
const SKILLS = [
  { name: 'Python', icon: 'python.svg' },
  { name: 'JavaScript', icon: 'javascript.svg' },
  { name: 'Node.js', icon: 'nodejs.svg' },
  { name: 'React', icon: 'react.svg' },
  { name: 'Next.js', icon: 'nextjs.svg' },
  { name: 'C#', icon: 'csharp.svg' },
  { name: '.NET', icon: 'dotnet.svg' },
  { name: 'Java', icon: 'java.svg' },
  { name: 'Linux', icon: 'linux.png' },
  { name: 'Git', icon: 'git.svg' },
  { name: 'MongoDB', icon: 'mongodb.svg' },
  { name: 'PostgreSQL', icon: 'postgresql.svg' },
  { name: 'SQLite', icon: 'sqlite.svg' },
  { name: 'Firebase', icon: 'firebase.svg' },
  { name: 'AWS', icon: 'aws.svg' },
  { name: 'Azure', icon: 'azure.svg' },
  { name: 'Alibaba Cloud', icon: 'alibabacloud.svg' },
  { name: 'n8n', icon: 'n8n.png' },
];

export default async function HomePage() {
  const [firestoreCertificates, profile] = await Promise.all([getCertificates(), getProfileSettings()]);
  // Hardcoded certificates first, then the ones published from the admin portal.
  const certificates: CertificateCard[] = [
    ...hardcodedCertificates,
    ...firestoreCertificates.map((c) => ({ ...c, title: c.title || 'Untitled certificate' })),
  ];

  return (
    <>
      {/* --- HERO SECTION --- */}
      <section className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black -z-10"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight tracking-tight mb-6">
            Hello, I&apos;m <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-pulse">
              Niranga Nayanajith
            </span>
          </h1>
          <p className="text-xl md:text-3xl text-slate-400 font-medium mb-6">A Developer &amp; Cybersecurity Enthusiast</p>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
            I am currently an undergraduate at the Faculty of Computing, Sabaragamuwa University of Sri Lanka, with a
            passion for building innovative software and exploring the depths of cybersecurity.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="/projects"
              className="bg-cyan-600 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-full transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105"
            >
              View My Projects
            </Link>
            <a
              href="#contact"
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-full transition-all border border-gray-700"
            >
              Get In Touch
            </a>
          </div>
        </div>
      </section>

      {/* --- ABOUT & IMAGE SHOWCASE SECTION --- */}
      <section id="about" className="relative py-24 px-6 md:px-20 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="md:w-1/2 space-y-6">
            <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              About Me
            </h2>
            <p className="leading-relaxed text-lg text-slate-300">
              I am a dedicated and results-driven undergraduate student. My academic journey has equipped me with a
              strong foundation in computer science principles.
            </p>
            <p className="leading-relaxed text-lg text-slate-300">
              As a <span className="font-semibold text-cyan-400">developer</span>, I specialize in creating robust and
              efficient software solutions. My skills include front-end and back-end development. As a{' '}
              <span className="font-semibold text-cyan-400">cybersecurity enthusiast</span>, I have a keen interest in
              network security, ethical hacking, and data protection, continuously working to understand and defend
              against digital threats.
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <ProfileShowcase images={profile.profileImages} intervalSeconds={profile.intervalSeconds} />
          </div>
        </div>
      </section>

      {/* --- LANGUAGES & TECHNOLOGIES SECTION --- */}
      <section id="skills" className="py-24 px-6 md:px-20 bg-black">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-16">
            Languages &amp; Technologies
          </h2>
          <ul className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
            {SKILLS.map((tech) => (
              <li
                key={tech.name}
                className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-900 rounded-2xl p-3 sm:p-4 border border-gray-800 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:-translate-y-2 transition-all group"
                title={tech.name}
              >
                <span className="relative block w-full h-full">
                  <Image
                    src={`/icons/skills/${tech.icon}`}
                    alt={tech.name}
                    fill
                    sizes="80px"
                    className="object-contain group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all"
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- SHOWCASE DIRECTORY --- */}
      {/* The two remote GIFs were removed (multi-MB, hotlinked). Phase 1 replaces this
          block with the themed Operations section. */}
      <section className="py-24 px-6 md:px-20 bg-gray-950 border-y border-gray-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
          <Link
            href="/articles"
            className="group flex flex-col items-center gap-6 p-12 bg-black border border-gray-800 rounded-2xl hover:border-cyan-500 transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
          >
            <FileText size={56} className="text-cyan-700 group-hover:text-cyan-400 transition-colors" aria-hidden="true" />
            <h3 className="text-2xl font-bold text-cyan-400 group-hover:text-cyan-300">Visit for articles</h3>
          </Link>
          <Link
            href="/projects"
            className="group flex flex-col items-center gap-6 p-12 bg-black border border-gray-800 rounded-2xl hover:border-cyan-500 transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
          >
            <FolderGit2 size={56} className="text-cyan-700 group-hover:text-cyan-400 transition-colors" aria-hidden="true" />
            <h3 className="text-2xl font-bold text-cyan-400 group-hover:text-cyan-300">Visit project showcase</h3>
          </Link>
        </div>
      </section>

      {/* --- CERTIFICATES SECTION --- */}
      <section className="py-24 px-6 md:px-20 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-16">
            Curated Certificates
          </h2>
          <CertificateGrid certificates={certificates} />
        </div>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section id="contact" className="py-24 px-6 md:px-20 bg-gradient-to-t from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-8">
            Connect With Me
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-md">
            Feel free to reach out to me on any of the platforms below. I&apos;m always open to new opportunities,
            collaborations, or just a friendly chat!
          </p>
          <ul className="space-y-6">
            <li>
              <a
                href="https://www.linkedin.com/in/niranga-nayanajith-548a0a302"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-4 text-xl font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span className="p-3 bg-cyan-950 rounded-lg">
                  <Image src="/icons/social/linkedin.svg" alt="" width={32} height={32} />
                </span>
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href="https://github.com/nngeek195"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-4 text-xl font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span className="p-3 bg-cyan-950 rounded-lg">
                  <Image src="/icons/social/github.svg" alt="" width={32} height={32} className="bg-white rounded-full" />
                </span>
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </section>

      {/* --- DIGITAL TWIN CHATBOT --- */}
      <ChatWidget />
    </>
  );
}
