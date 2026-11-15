// Hardcoded certificates, shown alongside the ones published from the
// Certificates admin portal (Firestore). Raw entries use whatever fields were
// easiest to fill in; they're normalized below into the same shape Firestore
// certificates use (mediaUrls, dateIssued, credentialUrl), so the UI never
// needs to know which source a certificate came from.

export type Certificate = {
  id: string;
  title: string;
  issuer: string;
  dateIssued: string;
  credentialUrl: string | null;
  mediaUrls: string[];
};

// Fallback image when a certificate has none, or its image fails to load.
// PLACEHOLDER: cert-image — generic stand-in, not a real certificate.
export const CERT_PLACEHOLDER = '/images/placeholders/cert.svg';

const GH = 'https://raw.githubusercontent.com/nngeek195/Portfilio/main/Images';
const COURSERA = (id: string) =>
  `https://s3.amazonaws.com/coursera_assets/meta_images/generated/CERTIFICATE_LANDING_PAGE/CERTIFICATE_LANDING_PAGE~${id}/CERTIFICATE_LANDING_PAGE~${id}.jpeg`;

type RawCertificate = { title: string; issuer: string; issued: string; img?: string; link?: string };

const raw: RawCertificate[] = [
  {
    title: 'Build Your Own AI Chatbot with Microsoft Foundry',
    issuer: 'Microsoft Learn Student Ambassadors - Sri Lanka',
    issued: 'Dec 2025',
    img: `${GH}/SAMS.png`,
  },
  {
    title: 'Introduction to FinOps',
    issuer: 'FinOps Foundation',
    issued: 'Dec 2025',
    // PLACEHOLDER: finops-cert-image — the previous image was a signed Skilljar URL
    // that expired (now returns 403). Upload the certificate image (e.g. to the
    // Portfilio repo or Cloudinary) and set `img` here.
    link: 'https://verify.skilljar.com/c/pdbdz4ebiabb',
  },
  {
    title: 'Introduction to AI',
    issuer: 'Coursera',
    issued: 'Oct 2025',
    img: COURSERA('EE12C3N36948'),
    link: 'https://www.coursera.org/account/accomplishments/verify/EE12C3N36948',
  },
  {
    title: 'Maximize Productivity With AI Tools',
    issuer: 'Coursera',
    issued: 'Oct 2025',
    img: COURSERA('I1S0QDJU8YPY'),
    link: 'https://www.coursera.org/account/accomplishments/verify/I1S0QDJU8YPY',
  },
  {
    title: 'Discover the Art of Prompting',
    issuer: 'Coursera',
    issued: 'Oct 2025',
    img: COURSERA('02BUVU4B9I9D'),
    link: 'https://www.coursera.org/account/accomplishments/verify/02BUVU4B9I9D',
  },
  {
    title: 'Use AI Responsibly',
    issuer: 'Coursera',
    issued: 'Oct 2025',
    img: COURSERA('MR9ZLDZSAP4V'), // was reusing the "Art of Prompting" image
    link: 'https://www.coursera.org/account/accomplishments/verify/MR9ZLDZSAP4V',
  },
  {
    title: "J'pura Xtream 2025",
    issuer: 'IEEE Student Branch - University of Sri Jayewardenepura',
    issued: 'Oct 2025',
    img: `${GH}/jpura.png`,
  },
  {
    title: 'AI Buildathon',
    issuer: 'IEEE Computer Society of KDU',
    issued: 'Oct 2025',
    img: `${GH}/Tensorforge.png`,
  },
  {
    title: 'Networking Basics',
    issuer: 'Cisco Networking Academy',
    issued: 'Jan 2025',
    img: 'https://images.credly.com/images/5bdd6a39-3e03-4444-9510-ecff80c9ce79/image.png',
    link: 'https://www.credly.com/badges/46b2283d-4e9e-4eb4-a797-85e0a975dd99/public_url',
  },
  {
    title: 'SQL Injection',
    issuer: 'Simplilearn',
    issued: 'Dec 2024',
    img: 'https://certificates.simplicdn.net/share/7675399_78156301734346976411.png',
    link: 'https://www.simplilearn.com/skillup-certificate-landing?token=eyJjb3Vyc2VfaWQiOiIyNDM3IiwiY2VydGlmaWNhdGVfdXJsIjoiaHR0cHM6XC9cL2NlcnRpZmljYXRlcy5zaW1wbGljZG4ubmV0XC9zaGFyZVwvNzY3NTM5OV83ODE1NjMwMTczNDM0Njk3NjQxMS5wbmciLCJ1c2VybmFtZSI6Ik5pcmFuZ2EgTmF5YW5haml0aCJ9&utm_source=shared-certificate&utm_medium=lms&utm_campaign=shared-certificate-promotion&referrer=https%3A%2F%2Flms.simplilearn.com%2Fcourses%2F5141%2FSQL-Injection-For-Beginners%2Fcertificate%2Fdownload-skillup&%24web_only=true',
  },
  {
    title: 'Ethical Hacking - Mobile Platforms and Network Architecture',
    issuer: 'Great Learning',
    issued: 'Nov 2024',
    img: 'https://d9jmtjs5r4cgq.cloudfront.net/ComplementaryCourseCertificate/5731008/original/K.H.A.Niranga_Nayanajith20241124-72-15z1wm.jpg',
    link: 'https://www.mygreatlearning.com/certificate/AVUFKFYY',
  },
  {
    title: 'Innovate with Ballerina Coding Challenge',
    issuer: 'WSO2',
    issued: 'Nov 2024',
    img: `${GH}/qq.jpg`,
    link: 'https://certificates.ballerina.io/IWB24P-sRi3bCQYAy',
  },
  {
    title: 'Introduction to Cyber Crime',
    issuer: 'Great Learning',
    issued: 'Nov 2024',
    img: `${GH}/intruduction%20cyber.jpeg`, // cyber_crime.jpg no longer exists in the repo
    link: 'https://www.mygreatlearning.com/certificate/PGAZALGR',
  },
  {
    title: 'Introduction to Cyber Security',
    issuer: 'Great Learning',
    issued: 'Nov 2024',
    img: 'https://d9jmtjs5r4cgq.cloudfront.net/ComplementaryCourseCertificate/5697763/original/K.H.A.Niranga_Nayanajith20241119-74-qqnrvz.jpg',
    link: 'https://www.mygreatlearning.com/certificate/OFTDRZTK',
  },
  {
    title: 'Introduction to Ethical Hacking',
    issuer: 'Great Learning',
    issued: 'Nov 2024',
    img: 'https://d9jmtjs5r4cgq.cloudfront.net/ComplementaryCourseCertificate/5726561/original/K.H.A.Niranga_Nayanajith20241123-73-1f7cdxy.jpg',
    link: 'https://www.mygreatlearning.com/certificate/FPPLCLCG',
  },
  {
    title: 'MoraXtreame Hackerthon',
    issuer: 'IEEE Student Branch University of Moratuwa',
    issued: 'Nov 2024',
    img: `${GH}/q.jpg`,
    link: 'https://drive.google.com/file/d/1WXikJOCaKOf7FNVSX-HtMmynb2PVF1NX/view',
  },
  {
    title: 'Introduction to Programming Using Python',
    issuer: 'Kaggle',
    issued: 'Aug 2024',
    img: `${GH}/ss.png`,
    link: 'https://www.kaggle.com/learn/certification/nngeek/python',
  },
  {
    title: 'Responsive Web Design',
    issuer: 'freeCodeCamp',
    issued: 'Aug 2024',
    img: `${GH}/fre.jpeg`,
    link: 'https://freecodecamp.org/certification/fcc4441a823-f4dd-41a2-882a-0deefbb51731/responsive-web-design',
  },
  {
    title: 'Basic In Python',
    issuer: 'HackerRank',
    issued: 'Jun 2024',
    img: `${GH}/me.jpg`,
    link: 'https://www.hackerrank.com/certificates/iframe/705d0f988340',
  },
  {
    title: 'Introduction to Programming',
    issuer: 'Kaggle',
    issued: '',
    img: `${GH}/we.png`,
    link: 'https://www.kaggle.com/learn/certification/nngeek/intro-to-programming',
  },
];

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const hardcodedCertificates: Certificate[] = raw.map((c, idx) => ({
  id: `hardcoded-${slugify(c.title)}-${idx}`,
  title: c.title,
  issuer: c.issuer,
  dateIssued: c.issued,
  credentialUrl: c.link ?? null,
  mediaUrls: c.img ? [c.img] : [],
}));
