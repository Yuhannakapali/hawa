# Paragliding Forecast App: MVP Specification

Oct 29, 2026 · @Yuhanna kapali

## Overview

The MVP is a free, ad-free mobile app that tells paragliding pilots in Nepal which sites are flyable, and when. It uses open weather data and our own scoring logic. It does not copy code or data from Windy or other apps.

**Problem.** Pilots check several apps (Windy, weather sites, local chat groups) to decide if they can fly. Most apps show raw weather data, not a clear answer for a launch site. Many apps show ads or need paid plans.

**MVP goals**

1. Give a clear flyability score (green, yellow, red) for each site, for each hour, for 3 days.
2. Show wind at launch height and at altitude, so pilots can check for strong winds above.
3. Send an alert when a favorite site becomes flyable.
4. Work on Android, iOS, and the web (a website in any browser), with no ads and no account needed.

**Working name:** to be decided.

## Target users and user stories

The first users are student and club pilots who fly in Nepal, mainly at Sarangkot (Pokhara) and sites near Kathmandu.

| User | Need |
| --- | --- |
| Student pilot (APPI 1 to 3) | A simple yes or no answer, with safe limits for low experience |
| Club or free pilot | Wind at altitude, thermal strength, and cloud base for longer flights |
| Tandem operator | A quick daily check for many flights at one site |
| Visiting pilot | Site information and local rules for sites they do not know |

**User stories**

1. As a pilot, I want to see a list of sites with a color for today, so that I can choose where to go.
2. As a pilot, I want to open a site and see the score for each hour, so that I can choose the best time.
3. As a pilot, I want to see wind at 1000 m, 2000 m, and 3000 m, so that I can avoid strong wind above the launch.
4. As a pilot, I want to mark sites as favorites, so that I see them first.
5. As a pilot, I want an alert the evening before a flyable day, so that I can plan my morning.
6. As a student pilot, I want stricter limits, so that the score matches my level.
7. As a pilot, I want to see the last forecast when I have no signal, so that I can check it at the launch.

## MVP scope

The MVP has 8 features. All other features wait until after launch.

| Feature | In MVP | Reason |
| --- | --- | --- |
| Site list with daily color | Yes | Main answer for the pilot |
| Hourly flyability score (3 days) | Yes | Helps the pilot choose a time |
| Wind by height (surface to 3000 m) | Yes | Main safety check |
| Thermal and cloud base estimate | Yes | Needed for planning longer flights |
| Favorites and alerts | Yes | Brings users back each day |
| Offline cache of last forecast | Yes | Signal is weak at many launches |
| Pilot level setting (student or pilot) | Yes | Changes the score limits |
| Skew-T chart | No | Advanced, add in version 2 |
| Variometer and in-flight tools | No | Needs careful safety testing |
| Flight log, IGC files, live tracking | No | Separate product area |
| User accounts and pilot reports | No | Needs moderation |
| Webcams and live weather stations | No | Needs partners at each site |

The MVP covers Nepal only, with 10 to 15 sites added by hand.

The website (F8) is also in the MVP. It uses the same code as the mobile app.

## Feature specifications

**F1. Site list**

- The app shows all sites in a list and on a map.
- Each site shows a color for today and tomorrow: green (flyable), yellow (marginal), red (not flyable).
- Favorites show at the top.
- Expected result: the pilot sees the best site for today in under 3 seconds.

**F2. Site detail and hourly score**

- The screen shows the score for each hour from 06:00 to 18:00 local time, for 3 days.
- Each hour shows wind speed, gust, direction, and the reason for the score (for example, "gusts too strong").
- The screen shows the site's good wind directions as a compass sector.

**F3. Wind by height**

- A table shows wind speed and direction at surface, 1000 m, 2000 m, and 3000 m above sea level, for each hour.
- Cells with wind above the pilot's limit show in red.

**F4. Thermals and cloud base**

- The app shows CAPE (convective available potential energy, a measure of thermal strength) as low, medium, or high.
- The app shows an estimated cloud base height in meters.
- The app shows a warning when the risk of storms is high in the afternoon.

**F5. Favorites and alerts**

- The pilot marks a site as a favorite with one tap.
- At 19:00 local time, the app sends a push notification if a favorite site is green for the next day.
- The pilot can turn alerts on or off for each site.

**F6. Offline cache**

- The app stores the last forecast for all favorite sites on the phone.
- When there is no signal, the app shows the cached forecast and the time it was updated.

**F7. Pilot level**

- The pilot chooses "Student" or "Pilot" in settings.
- The level changes the wind and gust limits in the score (see the next section).

**F8. Website**

- The same app runs as a website in any modern browser (Chrome, Safari, Firefox, Edge), on phone and computer.
- The website has the same 5 screens and the same scores as the mobile app.
- The pilot can install the website on the phone home screen (a progressive web app, or PWA: a website that works like an app).
- The website stores favorites and settings in the browser. Alerts use web push notifications where the browser allows them.
- A simple public home page explains the app and links to the website, Play Store, and App Store.
- Expected result: a pilot with no app installed can check a site from a link in a chat group.

## Flyability score logic

The score for each hour is the worst result of 6 checks. If one check is red, the hour is red. The limits below are starting values only. A local instructor must review them before launch.

| Check | Green | Yellow | Red |
| --- | --- | --- | --- |
| Launch wind speed, Student (km/h) | 5 to 15 | 15 to 18 | above 18 |
| Launch wind speed, Pilot (km/h) | 5 to 20 | 20 to 25 | above 25 |
| Gust minus mean wind (km/h) | below 8 | 8 to 12 | above 12 |
| Wind direction | inside launch sector | within 20° of sector | outside |
| Wind at 2000 m (km/h) | below 25 | 25 to 35 | above 35 |
| Rain (mm/h) | 0 | 0.1 to 0.5 | above 0.5 |
| Storm risk (CAPE in J/kg, afternoon) | below 800 | 800 to 1500 | above 1500 |

**Rules**

1. Calculate each check for the hour.
2. Set the hour's score to the worst check result.
3. Show the check that caused the score as the reason.
4. Set the daily color to the best 3-hour block between 09:00 and 16:00.

Wind below 5 km/h is green for launch but may make a forward launch harder. The app shows a note for this case.

**Safety note in the app:** the score is a guide only. The pilot is responsible for the decision to fly.

## Data sources and licensing

The MVP uses Open-Meteo for all weather data. We add site data by hand. We use no data or code from Windy or other paragliding apps.

| Source | Data | Terms |
| --- | --- | --- |
| [Open-Meteo forecast API](https://open-meteo.com/en/terms) | Hourly wind, gusts, wind at pressure levels, CAPE, cloud cover, rain, from ICON, GFS, and ECMWF models | Free tier: non-commercial only, below 10,000 calls a day, 5,000 an hour, 600 a minute. Data is CC BY 4.0, so the app must show credit to Open-Meteo. Commercial use needs a paid plan. |
| Own site database | Name, location, launch height, good wind sectors, landing zone, notes | Our own data, checked with local pilots |
| Map tiles (MapLibre with an OpenStreetMap-based tile provider) | Base map | Use a tile provider or host our own tiles. Do not load tiles directly from the public OpenStreetMap servers in an app. |

**Open questions**

- [ ] Does a free, ad-free app run by Orinova count as non-commercial for Open-Meteo? Ask Open-Meteo before launch, or budget for a paid plan.
- [ ] Option: host our own Open-Meteo server (the code is open source) if call volume grows.

The backend caches forecasts, so call volume depends on the number of sites, not the number of users. With 15 sites updated every hour, the backend makes about 360 calls a day.

## System architecture and tech stack

The app talks only to our backend. Only the forecast job calls Open-Meteo, so the number of users does not change the number of data calls.

&#91;embedded content: MVP architecture · backend, data source, app, push\]

The forecast job gets data and calculates scores every hour. The app reads scores from the REST API over HTTPS. The alert job sends push notifications through Firebase.

| Part | Choice | Reason |
| --- | --- | --- |
| Mobile app | Flutter (Dart) | One codebase for Android, iOS, and the website (Flutter web). A static HTML home page helps search engines find the app. |
| Map | MapLibre with a hosted vector tile provider | Free and open source |
| Local cache | SQLite on the phone | Offline forecast for favorites |
| Backend | Python with FastAPI | Simple, fast to build, good weather data libraries |
| Database | PostgreSQL (managed) | Reliable, low cost |
| Jobs | Scheduled tasks on the same server | No extra service needed for the MVP |
| Push | Firebase Cloud Messaging | Free, works on Android and iOS |
| Hosting | One small cloud server | Low cost, enough for the MVP |

If the team knows Node.js better, the backend can use Node.js with TypeScript. The API design does not change.

## Data model

The backend stores 4 tables in PostgreSQL. The app does not need user accounts. Each phone gets an anonymous device ID.

**sites**

| Field | Type | Example |
| --- | --- | --- |
| id | UUID |  |
| name | text | Sarangkot |
| lat, lon | decimal | 28.244, 83.949 |
| launch\_alt\_m | integer | 1590 |
| landing\_alt\_m | integer | 800 |
| wind\_sectors | JSON list of degree ranges | \[\[135, 225\]\] |
| min\_level | text: student or pilot | student |
| notes | text | Landing at Phewa Lake |
| active | boolean | true |

**forecast\_hours**

| Field | Type |
| --- | --- |
| site\_id | UUID |
| time\_utc | timestamp |
| model | text (icon, gfs, ecmwf) |
| wind\_10m\_kmh, gust\_kmh, dir\_deg | decimal |
| wind\_1000m, wind\_2000m, wind\_3000m (speed and direction) | decimal |
| cape\_jkg, cloud\_base\_m, rain\_mm | decimal |
| score\_student, score\_pilot | text: green, yellow, red |
| reason | text |
| fetched\_at | timestamp |

**devices**

| Field | Type |
| --- | --- |
| device\_id | UUID |
| push\_token | text |
| level | text: student or pilot |
| alert\_time\_local | time (default 19:00) |

**favorites**

| Field | Type |
| --- | --- |
| device\_id | UUID |
| site\_id | UUID |
| alerts\_on | boolean |

The launch altitude for Sarangkot is an example. Check all site values with local pilots.

## API endpoints

The backend gives a small REST API. All responses are JSON. The app sends the device ID in the `X-Device-Id` header.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/v1/sites` | List all active sites with today's and tomorrow's daily color |
| GET | `/v1/sites/{id}` | Site details |
| GET | `/v1/sites/{id}/forecast?days=3&level=student` | Hourly forecast and score for one site |
| POST | `/v1/devices` | Register a device with its push token and pilot level |
| PATCH | `/v1/devices/{id}` | Change pilot level or alert time |
| PUT | `/v1/devices/{id}/favorites/{siteId}` | Add a favorite or change alerts |
| DELETE | `/v1/devices/{id}/favorites/{siteId}` | Remove a favorite |
| GET | `/v1/status` | Time of the last forecast update and data credits |

**Background jobs**

1. Every hour: get the forecast from Open-Meteo for each active site, calculate scores, and save them.
2. Every 15 minutes: find devices whose alert time has come, and send a push notification if a favorite site is green tomorrow.
3. Every day: delete forecast rows older than 7 days.

## Screens and user flow

The MVP has 5 screens.

| Screen | Content | Actions |
| --- | --- | --- |
| Onboarding (first start only) | Short safety note, pilot level choice | Choose Student or Pilot, allow notifications |
| Home | Site list with colors for today and tomorrow, favorites first; switch to map view | Tap a site, add favorite |
| Site detail | Hourly score strip for 3 days, reason for each hour, launch wind compass | Change day, open wind by height |
| Wind by height | Table of wind at surface, 1000 m, 2000 m, 3000 m for each hour | Change day |
| Settings | Pilot level, alert time, units, data credits, safety note | Change values |

**Main flow**

1. The pilot opens the app and sees the home screen.
2. The pilot taps a green or yellow site.
3. The pilot checks the hourly score and the reason.
4. The pilot opens wind by height to check for strong wind above the launch.
5. The pilot taps the star to add the site to favorites.
6. In the evening, the pilot gets an alert if the site is green the next day.

## Non-functional requirements

| Area | Requirement |
| --- | --- |
| Performance | Home screen loads in under 2 seconds on a 3G connection. API responses are under 50 KB. |
| Offline | The app shows the last cached forecast for favorites with no signal, and shows the update time. |
| Freshness | The backend updates forecasts every hour. The app shows a warning if data is older than 6 hours. |
| Platforms | Android 8 and later, iOS 15 and later, and current versions of Chrome, Safari, Firefox, and Edge. On iPhone, web push alerts work only after the pilot adds the website to the home screen. |
| Privacy | No accounts, no location tracking, no ads, no third-party analytics. Store only device ID, push token, and settings. |
| Units | km/h and meters by default. Option for knots and feet. |
| Time | All times show in Nepal time (UTC+05:45). The backend stores UTC. |
| Credits | The app shows "Weather data by Open-Meteo.com" in settings and on the forecast screens (CC BY 4.0). |
| Safety | The app shows a safety note on first start and in settings: the score is a guide only, and the pilot is responsible for the decision to fly. |
| Cost | Hosting under USD 20 a month for the MVP (one small server and a managed database), not counting a paid Open-Meteo plan. |

## Milestones and timeline

The MVP takes about 14 weeks with 1 to 2 developers. Two gates must pass before the next step starts.

&#91;embedded content: MVP plan · 4 phases, 2 gates\]

The app does not launch until instructors approve the score limits and test pilots agree with the score on at least 80% of checked days.

## Risks, success metrics, and roadmap

**Risks**

| Risk | Effect | Action |
| --- | --- | --- |
| Forecast models are less accurate in Himalayan valleys | Wrong scores, unsafe trust | Test scores against real flying days for 4 weeks before launch. Show the safety note. |
| Score limits are wrong for a site | Wrong scores | Local instructors review limits for each site. |
| Open-Meteo free tier does not allow our use | Must pay or change source | Ask Open-Meteo early. Plan for a paid plan or a self-hosted server. |
| Pilots trust the app too much | Accidents | Always show the reason for the score. Never show "safe". Use "flyable" and "marginal". |
| Few users | No feedback | Launch with local schools and clubs in Pokhara and Kathmandu. |

**Success metrics (first 3 months)**

- 300 installs.
- 40% of users open the app at least once a week.
- Pilots agree with the score on 80% of checked days (from a short in-app "Was this right?" question).

**Roadmap after the MVP**

1. Version 2: Skew-T chart, model comparison, webcams and live weather stations.
2. Version 3: variometer, flight log with IGC files, live tracking, and SOS.
3. Version 4: pilot reports, site guides for other countries, Nepali language.
