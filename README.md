# QB Dental demo (v4)

Demo website and appointment panel for QB Dental Implant and Integrative Dentistry, Arlington Heights, IL.
Built by Navy Night Creative.

**This is a demo.** All patient data is fictional and stays in the visitor's browser (localStorage).
Do not enter real patient information. The page is set to `noindex`.

## What's inside

- Website in English and Turkish: home page, seven care pages, urgent-visit routing, mobile call/book bar
- Three-step online booking
- "Change a visit" page: patients change or cancel with their confirmation code and phone number
- Staff panel (`#/admin`): schedule, requests with clash checks, appointments, reports, team (lunch breaks, time off), settings, owner alerts preview, print day list

## Files

| Path | What it is |
|---|---|
| `index.html` | The built, self-contained page. Open it in a browser or publish it as is. |
| `src/index.html` | Page shell (meta tags, security policy, structured data) |
| `src/styles.css` | All styles |
| `src/core.js` | Data, demo seed, availability, clash checks, alerts, automatic deletion |
| `src/site.js` | Public site, care pages, booking, change/cancel page (EN/TR) |
| `src/panel.js` | Staff panel, events and router |
| `build.py` | Joins `src/` into `index.html` and embeds the fonts |

## Build

```bash
npm install        # fonts (Hedvig Letters Serif, Instrument Sans)
python3 build.py   # writes index.html
```

Edit files in `src/`, then run the build again. `index.html` is committed so the site can be published without a build step.

## Publish

- **Netlify:** connect this repository; `netlify.toml` publishes the folder as is.
- **Netlify Drop:** drag `index.html` onto the site's Deploys page.

## Demo accounts

Open `#/admin` and pick Doctor, Front desk or Office manager. No passwords in the demo.

## Before going live

The live version needs a real backend in the practice's own accounts with a signed BAA, server-side sign-in with two-step verification,
server-side rate limits on the change/cancel page, and the practice's own photos (the demo uses Unsplash stock photos as placeholders).
