# webSchedules

Web port of the **Game Schedules** iOS app (`../Schedules`). Same feeds, same
"hide the score until you ask for it" behaviour, built with Vite + React + TypeScript.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle into dist/
npm run preview  # serve dist/ with the same API proxies
```

## Picking teams

There is no settings screen. The teams shown come from the `teams` query parameter:

| URL | Result |
| --- | --- |
| `/` | every team (default) |
| `/?teams=warriors,t1` | Warriors and T1 only |
| `/?teams=all` | every team |
| `/?teams=sports` | Warriors, Giants and 49ers |

Tokens match either the slug or the full team name, ignoring case, spaces and
punctuation, so `?teams=Golden%20State%20Warriors,g2` works too. `sports` is a
group keyword and combines with individual teams, e.g. `?teams=sports,t1`.
Anything that doesn't match is listed in a warning banner.

| Slug | Team | Feed |
| --- | --- | --- |
| `warriors` | Golden State Warriors | NBA CDN schedule |
| `giants` | San Francisco Giants | MLB Stats API |
| `49ers` | San Francisco 49ers | ESPN NFL API |
| `t1` | T1 | LoL Esports API |
| `g2` | G2 Esports | LoL Esports API |
| `sentinels` | Sentinels | vlr.gg (scraped HTML) |

A team's schedule page is `/?teams=…&team=warriors`, so any view can be shared
as a link.

## Layout

```
src/
  models/     Team catalog (with URL slugs) and the Game value type
  lib/        fetch helpers, local-date helpers, lenient ISO 8601 parsing, ?teams= parsing
  services/   one module per feed, each returning Game[]; gameOverviewService builds
              the yesterday/today buckets across the selected teams
  hooks/      useSearchParams (query-string router), useAsyncData (load/abort/error)
  components/ HomePage, TeamSchedulePage and the row primitives
```

## The `/api/*` proxy is required

The iOS app called `cdn.nba.com`, `statsapi.mlb.com`, `site.api.espn.com`,
`esports-api.lolesports.com` and `www.vlr.gg` directly. A browser can't: those
origins don't grant CORS access, and the vlr.gg data only exists as HTML that
has to be scraped. So every request goes to a same-origin path that
`vite.config.ts` proxies:

| Path | Upstream |
| --- | --- |
| `/api/nba` | `https://cdn.nba.com` |
| `/api/mlb` | `https://statsapi.mlb.com` |
| `/api/espn` | `https://site.api.espn.com` |
| `/api/lol` | `https://esports-api.lolesports.com` |
| `/api/vlr` | `https://www.vlr.gg` (needs a browser `User-Agent`, or it 403s) |

`npm run dev` and `npm run preview` both apply these. **Hosting `dist/` as plain
static files is not enough** — whatever serves it (nginx, CloudFront, an API
gateway) has to forward the same five prefixes, otherwise every fetch fails on CORS.

## Differences from the iOS app

- **No settings screen or `TeamSettings`/UserDefaults.** Selection lives in the URL.
- **No notifications.** `NotificationManager` and `BackgroundRefreshManager` have no
  web equivalent that runs while the tab is closed, so the 6 AM summary is gone.
- **No local database.** SwiftData persistence is replaced by component state plus
  a refetch; the Refresh button reloads from the feeds.
- **Feed failures are isolated.** The overview uses `Promise.allSettled`, so one dead
  feed shows a warning rather than blanking the page.
- **Broadcast channels for LoL and VALORANT** are attached in the services, so they
  now appear on schedule pages too, not just the overview.
- SF Symbols are replaced with emoji, and `vlr.gg` HTML is parsed with `DOMParser`
  instead of `NSRegularExpression`.
