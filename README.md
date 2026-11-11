# Hawa

A free, ad-free app that tells paragliding pilots in Nepal which launch sites are flyable, hour by hour.
It runs on Android, iOS and the web from one React Native codebase, backed by a small Node.js API.

> The score is a guide only. The pilot is responsible for the decision to fly.

## What's in the repo

| Package | What it is |
| --- | --- |
| `packages/scoring` | The flyability rules (green / yellow / red) and their limits. Shared by the API and the app. |
| `packages/contracts` | TypeScript types for every API response. Shared by the API and the app. |
| `packages/api` | Fastify + TypeORM + PostgreSQL. Fetches forecasts from Open-Meteo, scores them, serves `/v1/*`. |
| `packages/app` | React Native (CLI) app. Runs on the web through React Native Web + Vite. |

The product spec is in `Paragliding Forecast App MVP Specification.md`.

## Requirements

- Node.js 22.11 or later (developed on Node 24) and npm. This repo uses **npm** workspaces.
- PostgreSQL 14 or later, running locally.
- Internet access: the API pulls weather data from [Open-Meteo](https://open-meteo.com) and the map loads tiles from [OpenFreeMap](https://openfreemap.org).

## First-time setup

```sh
npm install

# Create the databases (once)
createdb hawa
createdb hawa_test

# Create the tables and add the starting sites
DATABASE_URL=postgres://localhost/hawa npm run db:migrate -w @hawa/api
DATABASE_URL=postgres://localhost/hawa npm run db:seed -w @hawa/api
```

The seed is safe to run again: it updates sites by name and prints the sites before and after.

## Run the app in the browser

One command starts the API and the web app together:

```sh
npm run dev
```

Then open http://localhost:5173. It uses `postgres://localhost/hawa` unless you set `DATABASE_URL`.
Stop both with Ctrl+C. A "proxy error" line in the first second or two is the web app starting before
the API is ready; it goes away on its own.

To run them separately, use two terminals:

```sh
npm run dev:api     # API only, http://localhost:3000
npm run dev:web     # web app only, http://localhost:5173
```

The full commands behind these are:

**Terminal 1 — API** (http://localhost:3000)

```sh
DATABASE_URL=postgres://localhost/hawa npm run dev -w @hawa/api
```

On start it runs any new migrations, then refreshes the site forecasts (every hour) and the wind grid
(every 3 hours). It restarts by itself when you change API code.

**Terminal 2 — web app** (http://localhost:5173)

```sh
npm run web -w @hawa/app
```

Open:

- http://localhost:5173/ — public home page
- http://localhost:5173/app — the app (first visit shows onboarding)
- `http://localhost:5173/app/sites/<site-id>` — a site, shareable as a link

Vite forwards `/v1` requests to the API on port 3000. To point at another API, set `API_URL`:

```sh
API_URL=http://192.168.1.10:3000 npm run web -w @hawa/app
```

## API configuration

| Variable | Required | Default | Meaning |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | — | PostgreSQL connection string, e.g. `postgres://localhost/hawa` |
| `PORT` | no | `3000` | Port the API listens on |
| `HOST` | no | `0.0.0.0` | Address the API listens on |
| `OPEN_METEO_URL` | no | `https://api.open-meteo.com/v1/forecast` | Open-Meteo forecast endpoint (change it for a self-hosted server) |
| `WIND_DAILY_CALL_BUDGET` | no | `7000` | Most Open-Meteo calls the wind map layer may use in any 24 hours; after that the API serves cached wind only |
| `VAPID_PUBLIC_KEY` | no | — | Web push public key. Web alerts are off unless all three `VAPID_*` variables are set |
| `VAPID_PRIVATE_KEY` | no | — | Web push private key. Keep it secret |
| `VAPID_SUBJECT` | no | — | Contact for push services, e.g. `mailto:you@example.com` |
| `FIREBASE_SERVICE_ACCOUNT_FILE` | no | — | Path to the Firebase service account JSON. Android and iOS alerts are off without it |

Create the web push keys once with `npx web-push generate-vapid-keys`. For iOS, upload your APNs key in the
Firebase console; Firebase then delivers to iPhones too.

### Evening alerts

Every 15 minutes the API checks for devices whose alert time (18:00–21:00 Nepal time) has just passed. If a
site the pilot marked for alerts is green tomorrow for their level, it sends one push and does not send
again that day. A device whose push subscription has expired is removed.

Push delivery sits behind `PushChannel` in `packages/api/src/push/push-sender.ts`: `WebPushChannel` for
browsers, `FcmChannel` for Android and iOS. To change provider, write another channel and pass it to
`createPushSender` in `main.ts`; nothing else changes.

## Endpoints

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/v1/sites?level=student&limit=50&offset=0` | Active sites with today's and tomorrow's colour, paginated |
| GET | `/v1/sites/{id}` | One site |
| GET | `/v1/sites/{id}/forecast?days=3&level=student` | Hourly score 06:00–18:00 Nepal time, wind by height, thermals |
| GET | `/v1/wind-grid?bbox=w,s,e,n&zoom=7&height=10&time=<ISO time>` | Wind for the visible map area. `bbox` and `zoom` are required; `height` is 10, 2000 or 3000; nearest frame to `time`, or now |
| GET | `/v1/status` | Time of the last forecast update, whether it is stale, data credit |
| GET | `/v1/push/config` | `{ webPushPublicKey }`, or `null` when web push is not configured |
| PUT | `/v1/devices/{id}` | Registers or updates a device for alerts. `id` is a UUID the app creates. Body: `platform` (`web`, `android`, `ios`), `token` (FCM token, or the JSON web push subscription; 1–4096 chars), `level`, `alertTime` (`18:00`, `19:00`, `20:00`, `21:00`), `alertSiteIds` (up to 100 site UUIDs). Returns the device without its token. A token already used by another device moves to this one |
| DELETE | `/v1/devices/{id}` | Stops alerts for the device. Always `204` |

`level` is `student` or `pilot`.

### How the wind map layer is cached

The layer covers the Himalaya region (20–36°N, 72–100°E). Below zoom 6 the API serves one 2° grid for the
whole region; from zoom 6 it serves 0.5° tiles of 4° × 4° for the visible area. Each tile is fetched from
Open-Meteo at most once every 3 hours and stored in PostgreSQL, so every other request is served from the
database. The coarse grid and the tiles over Nepal are refreshed in the background; other tiles are fetched
the first time someone looks at them. Every fetch is logged in `wind_tile_fetches`, and once the last 24
hours reach `WIND_DAILY_CALL_BUDGET` the API stops fetching and serves what it has.

## Mobile (Android / iOS)

The native projects are in `packages/app/android` and `packages/app/ios`. They need the usual
[React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) (Android Studio, Xcode, CocoaPods).

```sh
npm start -w @hawa/app           # Metro bundler
npm run android -w @hawa/app     # in a second terminal
npm run ios -w @hawa/app
```

The native builds have not been run yet, and the native map is still a placeholder. On a device or
emulator the app reaches the API at `http://localhost:3000` (see `packages/app/src/config.ts`).

## Tests, type checks and builds

```sh
npm test            # all packages; the API tests use the hawa_test database
npm run typecheck
npm run build
npm run build:web -w @hawa/app     # production web build → packages/app/dist-web
```

The API tests reset the `hawa_test` database on every run. To use another database, set
`TEST_DATABASE_URL`.

## Database changes

Migrations are hand-written TypeORM classes in `packages/api/src/db/migrations`, listed in
`packages/api/src/db/data-source.ts`. Add a new file with the next timestamp, register it there, and run:

```sh
DATABASE_URL=postgres://localhost/hawa npm run db:migrate -w @hawa/api
```

## Troubleshooting

- **"Server error, please try again later" in the app** — the API is not running, or PostgreSQL is not.
  Check with `curl localhost:3000/v1/status` and `brew services list | grep postgres`.
- **Port already in use** — find the old process with `lsof -i :3000` or `lsof -i :5173`.
- **Wind layer says "Wind data unavailable"** right after the API starts — the first grid refresh takes
  a few seconds. Tap to retry.
- **A site shows no colours** — its forecast has not been fetched yet. Wait for the hourly refresh or
  restart the API.

## Data and credits

Weather data by [Open-Meteo.com](https://open-meteo.com), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), tiles by OpenFreeMap / OpenMapTiles,
rendered with MapLibre. Open-Meteo's free tier is for non-commercial use; see the open question in the spec
before launch.
