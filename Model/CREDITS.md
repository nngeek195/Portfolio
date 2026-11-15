# 3D Model Credits

Source files in this folder are git-ignored (only this file is tracked).
Optimized copies are generated into `public/models/` by `npm run models`
(see `scripts/models/`). The site footer shows the credit line for each model.

| Output file | Source file | Title | Author | Source | License |
|---|---|---|---|---|---|
| `public/models/rifle.glb` | `guns/riffel.glb` | VSSK Vykhlop \| Contract Wars | xlisov | https://sketchfab.com/3d-models/vssk-vykhlop-contract-wars-162cb40bccd24dd498b76c6bcd4f3738 | CC-BY-NC-4.0 per Sketchfab metadata; usage rights purchased by the site owner (see note) |
| `public/models/pistol.glb` | `guns/pistol.glb` | H&K USP Match \| Contract Wars | xlisov | https://sketchfab.com/3d-models/hk-usp-match-contract-wars-24eccdba4c464cfb87fade3182ad5783 | CC-BY-NC-4.0 per Sketchfab metadata; usage rights purchased by the site owner (see note) |
| `public/models/heli.glb` | `hellicopter.glb` | MH-6 Little Bird [Low Poly] | Muhamad Mirza Arrafi | https://sketchfab.com/3d-models/mh-6-little-bird-low-poly-d7068144bfeb4d91bde5d30755657d97 | CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/) |

Author profiles:
- xlisov: https://sketchfab.com/xlisov74
- Muhamad Mirza Arrafi: https://sketchfab.com/MirzaArrafiERV_45

## Rifle and pistol rights

<!-- PLACEHOLDER: gun-license-record — add the purchase details (seller, date,
     order/licence ID, scope of use) so the rights are documented alongside the
     credits. -->
The site owner states that usage rights for the rifle and pistol models were
purchased. Purchase record: _to be added_.

## Modifications made for this site

All three models (CC-BY requires stating changes):
- Re-oriented, re-centered, and split into separately named, animatable parts.
- Material fixes (metallic factor, single-sided faces; helicopter emissive removed,
  duplicate canopy glass removed).
- Textures converted to WebP; geometry compressed with Meshopt.
- Rifle and pistol: manufacturer and brand markings painted out of the textures
  (RUSTACT DYNAMICS, HENSOLDT/ZEISS, H&K/USP, DELTAPOINT/Leupold, suppressor
  flame and skull decals).
