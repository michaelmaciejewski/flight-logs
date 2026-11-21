# Flight Log

A single-page dashboard of every flight since 2005: route map, 3D globe, stats, trips, year-vs-year,
states and countries, an aircraft collection and an airport passport.

**Live site:** https://michaelmaciejewski.github.io/flight-logs/

## How the data works
- Flights live in a private Google Sheet. The page never links to it.
- `Code.gs` is a Google Apps Script attached to that sheet, deployed as a web app.
  - Anyone can **read** the flight rows (that's what the public page shows).
  - **Adding, editing, deleting** and **importing Flighty delays** need a token, kept only in the owner's
    browser — never in this repo.
  - `setupBackup()` turns on a nightly hidden backup tab (newest 14 kept).
- The page refreshes from the sheet on load, every minute, and when you return to the tab. Each device keeps
  its last good copy, so the site works offline (it installs as an app on phones).
- `.github/workflows/snapshot.yml` saves `snapshot.json` nightly as a fallback copy.

## Files
| File | What it is |
|---|---|
| `index.html` | The whole site |
| `Code.gs` | Apps Script for the sheet (`__TOKEN__` is a placeholder) |
| `sw.js`, `manifest.webmanifest`, `*.png` | Offline support, home-screen app, link preview image |
| `snapshot.json` | Nightly copy of the sheet (created by the workflow) |

Map data: Natural Earth (public domain).
