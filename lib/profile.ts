// Personal content for the site, in one place. Anything still missing is set
// to `null` and tagged PLACEHOLDER — the UI shows an amber [PLACEHOLDER] marker
// wherever it's used, so it's easy to spot on the page. See PLACEHOLDERS.md.

export const PROFILE = {
  name: 'Niranga Nayanajith',
  firstName: 'Niranga',
  lastName: 'Nayanajith',

  // PLACEHOLDER: callsign — your operator callsign (e.g. used in the hero,
  // dossier and nav). Also replaces the helicopter tail number later.
  callsign: null as string | null,

  roles: ['Developer', 'Cybersecurity'],
  unit: 'Faculty of Computing, Sabaragamuwa University of Sri Lanka',
  unitShort: 'Faculty of Computing · SUSL',
  status: 'Undergraduate',
  specialization: ['Software development (front-end & back-end)', 'Network security', 'Ethical hacking', 'Data protection'],

  // Sabaragamuwa University, Belihuloya.
  location: { label: 'Belihuloya, Sri Lanka', coords: '06°42′N 080°47′E', utcOffset: 'UTC+05:30' },

  email: 'niranganayanajith195@gmail.com' as string | null,

  socials: {
    linkedin: 'https://www.linkedin.com/in/niranga-nayanajith-548a0a302',
    github: 'https://github.com/nngeek195',
  },

  heroIntro:
    'Undergraduate at the Faculty of Computing, Sabaragamuwa University of Sri Lanka — building software and exploring the depths of cybersecurity.',

  bio: [
    'I am a dedicated and results-driven undergraduate student. My academic journey has equipped me with a strong foundation in computer science principles.',
    'As a developer, I specialize in creating robust and efficient software solutions across the front end and back end. As a cybersecurity enthusiast, I have a keen interest in network security, ethical hacking, and data protection — continuously working to understand and defend against digital threats.',
  ],
};

// Personal "sidearm" in the Personnel File: each pistol part labels a trait.
// PLACEHOLDER: sidearm-traits — suggested copy; edit to taste.
export const SIDEARM_TRAITS = [
  { part: 'red_dot', label: 'Optic', trait: 'Attention to detail' },
  { part: 'compensator', label: 'Compensator', trait: 'Control under pressure' },
  { part: 'slide', label: 'Slide', trait: 'Fast iteration' },
  { part: 'frame', label: 'Frame', trait: 'Strong CS fundamentals' },
  { part: 'magazine', label: 'Magazine', trait: 'Always reloading — learning' },
] as const;

export type ServiceEntry = {
  date: string;
  type: 'Education' | 'Hackathon' | 'Competition' | 'Role';
  title: string;
  org: string;
  detail?: string;
  // Marks an entry (or its detail line) as unconfirmed placeholder content.
  placeholder?: string;
};

// Service Record timeline, newest first.
// The competition entries come from your certificates; their detail lines are
// placeholders until you add your role / team / result.
// PLACEHOLDER: experience — add internships, jobs, volunteering, club roles.
export const SERVICE_RECORD: ServiceEntry[] = [
  {
    date: '[DATE]',
    type: 'Role',
    title: '[ROLE / INTERNSHIP]',
    org: '[ORGANISATION]',
    detail: 'Add your roles, internships and volunteering in lib/profile.ts.',
    placeholder: 'experience',
  },
  {
    date: 'Oct 2025',
    type: 'Hackathon',
    title: 'AI Buildathon',
    org: 'IEEE Computer Society of KDU',
    detail: '[Role, team and result]',
    placeholder: 'experience',
  },
  {
    date: 'Oct 2025',
    type: 'Hackathon',
    title: "J'pura Xtream 2025",
    org: 'IEEE Student Branch, University of Sri Jayewardenepura',
    detail: '[Role, team and result]',
    placeholder: 'experience',
  },
  {
    date: 'Nov 2024',
    type: 'Competition',
    title: 'Innovate with Ballerina Coding Challenge',
    org: 'WSO2',
    detail: '[Role, team and result]',
    placeholder: 'experience',
  },
  {
    date: 'Nov 2024',
    type: 'Hackathon',
    title: 'MoraXtreme',
    org: 'IEEE Student Branch, University of Moratuwa',
    detail: '[Role, team and result]',
    placeholder: 'experience',
  },
  {
    date: '[START YEAR] – Present',
    type: 'Education',
    title: 'Undergraduate, Faculty of Computing',
    org: 'Sabaragamuwa University of Sri Lanka',
    detail: 'Computing and information systems.',
    placeholder: 'experience',
  },
];
