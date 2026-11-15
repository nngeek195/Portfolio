import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Shared "night vision" grade for every 3D model: after normal PBR lighting, the
// final colour is converted to green phosphor luminance (strength uNV). Parts
// highlighted with emissive green therefore glow brighter, like the HUD accent.
export const NV_UNIFORM = { value: 0.85 };

export function applyNightVision(material: THREE.Material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNV = NV_UNIFORM;
    shader.fragmentShader =
      'uniform float uNV;\n' +
      shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        float nvL = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
        vec3 nvC = vec3(0.42, 1.0, 0.34) * pow(max(nvL, 0.0), 0.85) * 1.4;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, nvC, uNV);`
      );
  };
  material.customProgramCacheKey = () => 'nv-grade';
  material.needsUpdate = true;
}

/**
 * Gives every mesh under `root` its own material copy (so parts can be
 * highlighted independently) with the night-vision grade applied.
 * Returns the materials per top-level child name, for highlighting.
 */
export function prepareModel(root: THREE.Object3D) {
  const byPart = new Map<string, THREE.MeshStandardMaterial[]>();
  for (const part of root.children) {
    const list: THREE.MeshStandardMaterial[] = [];
    part.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((m) => {
        const copy = m.clone() as THREE.MeshStandardMaterial;
        applyNightVision(copy);
        list.push(copy);
        return copy;
      });
      mesh.material = Array.isArray(mesh.material) ? mats : mats[0];
    });
    byPart.set(part.name, list);
  }
  return byPart;
}

const GREEN = new THREE.Color('#7cff5b');

/** Sets an emissive green glow (0..1) on a part's materials. */
export function setGlow(materials: THREE.MeshStandardMaterial[] | undefined, amount: number) {
  if (!materials) return;
  for (const m of materials) {
    m.emissive.copy(GREEN);
    m.emissiveIntensity = amount * 0.55;
  }
}

// Procedural studio environment for metal reflections (no HDR download).
let envTexture: THREE.Texture | null = null;
export function getEnvironment(gl: THREE.WebGLRenderer) {
  if (!envTexture) {
    const pmrem = new THREE.PMREMGenerator(gl);
    envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }
  return envTexture;
}
