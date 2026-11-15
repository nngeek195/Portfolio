// The home page is one mission: each section is an objective. Every themed
// title has a plain label next to it so visitors never have to decode it.
export const OBJECTIVES = [
  { id: 'top', code: '01', title: 'Insertion', plain: 'Home' },
  { id: 'about', code: '02', title: 'Personnel File', plain: 'About' },
  { id: 'skills', code: '03', title: 'Loadout', plain: 'Skills' },
  { id: 'operations', code: '04', title: 'Operations', plain: 'Projects' },
  { id: 'experience', code: '05', title: 'Service Record', plain: 'Experience' },
  { id: 'certificates', code: '06', title: 'Commendations', plain: 'Certificates' },
  { id: 'contact', code: '07', title: 'Comms', plain: 'Contact' },
  { id: 'debrief', code: '08', title: 'Debrief', plain: 'Summary' },
] as const;

export type ObjectiveId = (typeof OBJECTIVES)[number]['id'];

export function objective(id: ObjectiveId) {
  return OBJECTIVES.find((o) => o.id === id)!;
}
