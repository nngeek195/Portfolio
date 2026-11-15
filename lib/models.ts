// Typed access to the manifest written by `npm run models`.
import manifest from './generated/models.json';

export type ModelId = 'rifle' | 'pistol' | 'heli';

export type ModelEntry = {
  id: ModelId;
  url: string;
  bytes: number;
  credit: { title: string; author: string; authorUrl: string; source: string; license: string; licenseUrl?: string };
  poster: { src: string; width: number; height: number; anchors: Record<string, [number, number]> };
  parts: { name: string; node: string; triangles: number; pivot: number[]; spinAxis?: number[] }[];
};

export const MODELS = manifest.models as unknown as ModelEntry[];

export function model(id: ModelId): ModelEntry {
  const m = MODELS.find((x) => x.id === id);
  if (!m) throw new Error(`Model "${id}" missing from lib/generated/models.json — run npm run models`);
  return m;
}
