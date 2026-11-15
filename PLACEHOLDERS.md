# Placeholders

Content that is missing or temporary. Every placeholder is tagged in the code
with `PLACEHOLDER: <id>`, and on the page it shows as an **amber dashed box**
(the element has `data-placeholder="<id>"`). Find them all with:

```bash
grep -rn "PLACEHOLDER:" app components lib public Model/CREDITS.md
```

or in the browser console on any page:

```js
[...document.querySelectorAll('[data-placeholder]')].map((e) => e.dataset.placeholder)
```

Most personal content lives in **`lib/profile.ts`** — fill in the `null`
values and `[...]` entries there.

## Visible on the home page

| ID | Where it shows | Where to fill it in |
|---|---|---|
| `callsign` | Nav, Hero ("Operation // …"), Personnel File, the boot preloader's HUD, and the 3D helicopter's tail number (amber `[CALLSIGN]` decal on the rear fuselage) | `PROFILE.callsign` in `lib/profile.ts`; the tail number picks it up automatically (`components/three/companion/CompanionHeli.tsx`) |
| `hero-art` | Hero, right-hand frame (currently a generic operator silhouette) | Send operator art: layered PNG/WebP, about 2560px wide |
| `featured-projects` | Operations ("Showing latest 6 — feature projects in the admin"); disappears once any project is featured | Admin → Importers & Sync → Manage Live Content → ★ Feature (optional order number) |

## In code only (not marked on the page)

| ID | Where | What's needed |
|---|---|---|
| `experience` | Not shown on the site: the Service Record lists only real entries (education + 4 competitions). Add roles there and they appear automatically; optional extras are the education start year (shows "Present") and a `detail` line (role, team, result) for each competition | `SERVICE_RECORD` in `lib/profile.ts` (commented example entry included) |
| `sidearm-traits` | `lib/profile.ts` (`SIDEARM_TRAITS`) | Suggested trait copy for the pistol parts in the Personnel File — edit to taste |
| `profile-photo` | `lib/content.ts`, `public/images/placeholders/profile.svg` | Only shown if `settings/profile` in Firestore has no images |
| `cert-image` | `lib/certificates.ts`, `public/images/placeholders/cert.svg` | Fallback for certificates with no image, or one that fails to load |
| `finops-cert-image` | `lib/certificates.ts` ("Introduction to FinOps") | The old signed Skilljar URL expired (403); upload the image and set `img` |
| `gun-license-record` | `Model/CREDITS.md` | Purchase details for the rifle and pistol rights (seller, date, licence ID) |
