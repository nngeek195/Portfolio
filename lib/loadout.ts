// Skills, grouped as rifle "modules". `part` is the node name in
// public/models/rifle.glb (see lib/generated/models.json), so the schematic
// callouts and the Phase 4 assembly animation point at the right part.
export type Skill = { name: string; icon: string };

// `anchor` (optional) overrides which part the schematic marker sits on.
// `modelParts`: rifle.glb nodes that make up this module in the 3D assembly.
export const LOADOUT: { part: string; anchor?: string; modelParts: string[]; slot: string; group: string; skills: Skill[] }[] = [
  {
    part: 'receiver',
    modelParts: ['receiver'],
    slot: 'Receiver',
    group: 'Core Languages',
    skills: [
      { name: 'Python', icon: 'python.svg' },
      { name: 'Java', icon: 'java.svg' },
      { name: 'C#', icon: 'csharp.svg' },
      { name: 'JavaScript', icon: 'javascript.svg' },
    ],
  },
  {
    part: 'scope',
    modelParts: ['scope', 'sight_rear', 'sight_front'],
    slot: 'Optic',
    group: 'Frontend',
    skills: [
      { name: 'React', icon: 'react.svg' },
      { name: 'Next.js', icon: 'nextjs.svg' },
    ],
  },
  {
    part: 'handguard',
    modelParts: ['handguard', 'foregrip'],
    slot: 'Handguard',
    group: 'Backend',
    skills: [
      { name: 'Node.js', icon: 'nodejs.svg' },
      { name: '.NET', icon: 'dotnet.svg' },
    ],
  },
  {
    part: 'magazine',
    modelParts: ['magazine'],
    slot: 'Magazine',
    group: 'Data',
    skills: [
      { name: 'MongoDB', icon: 'mongodb.svg' },
      { name: 'PostgreSQL', icon: 'postgresql.svg' },
      { name: 'SQLite', icon: 'sqlite.svg' },
      { name: 'Firebase', icon: 'firebase.svg' },
    ],
  },
  {
    part: 'stock',
    anchor: 'cheekrest', // the stock's centre sits behind the magazine
    modelParts: ['stock', 'cheekrest', 'buttpad'],
    slot: 'Stock',
    group: 'Cloud',
    skills: [
      { name: 'AWS', icon: 'aws.svg' },
      { name: 'Azure', icon: 'azure.svg' },
      { name: 'Alibaba Cloud', icon: 'alibabacloud.svg' },
    ],
  },
  {
    part: 'suppressor',
    modelParts: ['suppressor'],
    slot: 'Suppressor',
    group: 'Security & Ops',
    skills: [
      { name: 'Linux', icon: 'linux.png' },
      { name: 'Git', icon: 'git.svg' },
      { name: 'n8n', icon: 'n8n.png' },
    ],
  },
];
