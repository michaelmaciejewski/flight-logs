# Flight Log

A single-page dashboard of every flight since 2005: maps, stats, trips, milestones and an airport passport.

**Live site:** https://michaelmaciejewski.github.io/flight-logs/

## How the data works
- The flights live in a private Google Sheet. The page never links to it.
- `Code.gs` is a Google Apps Script attached to that sheet and deployed as a web app.
  - Anyone can **read** the flight rows, which is what the public page shows.
  - **Adding, editing and deleting** flights requires a token. The token is kept only in the
    owner's browser (localStorage), never in this repo.
- When the sheet changes, the page picks it up on load, every minute, and when you switch back to the tab.
- If the sheet can't be reached, the page falls back to the snapshot built into `index.html`.

## Setup
Open the site, click **Add flight** (or the sync pill), and follow the steps in the Connect panel.
`Code.gs` here has `__TOKEN__` as a placeholder. The panel's **Copy script** button fills in your token.
