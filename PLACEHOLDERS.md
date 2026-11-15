# Placeholders

Content that is missing or temporary. Every placeholder is tagged in the code
with `PLACEHOLDER: <id>`, so you can find them all with:

```bash
grep -rn "PLACEHOLDER:" app components lib public Model/CREDITS.md
```

## Active

| ID | Where | What's needed |
|---|---|---|
| `profile-photo` | `lib/content.ts`, `public/images/placeholders/profile.svg` | Only shown if `settings/profile` in Firestore has no images. Upload photos in `/admin/dashboard/media`. |
| `cert-image` | `lib/certificates.ts`, `public/images/placeholders/cert.svg` | Fallback for certificates with no image, or an image that fails to load. |
| `finops-cert-image` | `lib/certificates.ts` ("Introduction to FinOps") | The old image was a signed Skilljar URL that expired (403). Upload the certificate image and set `img`. |
| `gun-license-record` | `Model/CREDITS.md` | Purchase details for the rifle and pistol rights (seller, date, licence ID). |

## Coming in later phases

These will be added (and tagged the same way) when the sections that use them are built:

| ID | Phase | What's needed |
|---|---|---|
| `callsign` | 1 | Your callsign (also replaces the helicopter tail number "1801 TH"). |
| `experience` | 1 | Roles, internships, volunteering for the Service Record timeline. |
| `contact-email` | 1 | Email address for the Comms section (optional). |
| `hero-art` | 1 | Operator hero art / photo (layered PNG/WebP, about 2560px wide). |
