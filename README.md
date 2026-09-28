# bike or not

A commute-aware weather verdict for people who ride to work.

Most weather apps tell you it will rain. This one tells you whether *your*
ride is worth it — both legs of it, along your actual route, in your kit, with
your tolerance for suffering.

```bash
npm install && npm run dev
```

## What makes it different

**It knows your route, not just your city.** Enter where you set off and where
you're heading — street addresses, not just towns. It then routes you by bike
over OpenStreetMap and scores the morning and the evening separately along the
road you actually ride.

Innsbruck → Igls as the crow flies is 4.6 km and 289 m of climb. The real
cycling route is **6.7 km, ↑343 m and ↓58 m** — half a kilometre of climbing
the straight line never saw, and undulation that gives the "downhill" ride home
its own small climb.

Each field biases its search toward the other end of the route, so typing a
street name finds the one in your own town rather than the identically named
one four hundred kilometres away.

**Wind is directional, so the score is.** A 30 km/h wind is a gift going out
and a wall coming home. Every wind is resolved into head, tail and cross
components against your bearing, and the reciprocal in the evening.

**Hills are directional too.** Elevation is sampled at 48 points along the
route, so it counts every metre climbed rather than the difference between the
two ends. The return leg trades ascent for descent, and the packing list adds
"gear down early".

**Radar nowcast for the next two hours.** An hourly forecast smears a shower
that runs 08:20 to 08:40 across the whole of 08:00. At fifteen-minute
resolution it says "rain starting in about 75 minutes" instead.

**Saved routes.** Commute, weekend loop, school run — switch between them in a
click. Kept in `localStorage` alongside your settings.

**Built for a phone first.** It asks where you ride on first run rather than
showing a city you have never been to. Tap targets are thumb-sized, the week
scrolls, and nothing is gated behind a hover.

**English and French.** The first run follows the browser's language — French
if it is French, English for everything else — and it can be switched in
settings. Place search returns names in the same language.

**Six forecasts, not one.** ECMWF, ICON, GFS, GEM, UKMO and ARPEGE are queried
together. Where they disagree you are told; where several of them see rain the
headline forecast has missed, the score takes the more cautious view.

**It scores the hour you actually leave** — not the daily max, not "showers
later". And if leaving an hour earlier ducks the front, it says so.

**Ride-feel, not thermometer.** Cold is wind chill at your cruising speed
*including* the headwind you are riding into.

**Wet roads have memory.** Rain from three hours ago still means spray, slick
paint and greasy manhole covers under a clear sky.

## The model

Everything starts at 100 and loses points. Each penalty is capped
individually, so one bad factor can spoil a ride without a mild-but-broad day
collapsing to zero.

| Factor | Up to | Notes |
| --- | ---: | --- |
| Rain / snow | −62 | probability × intensity, raised to the model vote when several disagree |
| Cold | −42 | wind chill at riding speed, banded by rider profile |
| Heat | −32 | humidity-amplified above 26 °C |
| Wind | −30 | headwind component, +16 gusts, +12 crosswind |
| Ice risk | −30 | sub-2 °C with moisture on the road |
| Darkness | −24 | −4 if you have lights fitted |
| Air quality | −24 | PM2.5 above 12 µg/m³ |
| Visibility | −22 | fog, heavy precipitation |
| Climb | −18 | total ascent over the route, halved on an e-bike |
| UV | −8 | index 8 and above |
| Tailwind | +5 | credit where it is due |
| Descent | +6 | free height, counted separately so rolling routes get both |

Five hard blockers override the arithmetic: thunderstorms, heavy snowfall,
black-ice conditions, gusts over 65 km/h, near-zero visibility.

Four rider profiles — *Fair-weather*, *Regular*, *All-weather*, *Hardened* —
scale the comfort band and every tolerance divisor.

The worse leg carries 62% of the combined score. A glorious ride home does not
undo a soaking on the way in.

## Stack

| | |
| --- | --- |
| Vite 8 · React 19 · TypeScript | app shell |
| Tailwind CSS v4 | styling, `@theme inline` tokens, light + dark |
| TanStack Query | fetching, caching, refetch-on-focus, retries |
| Zustand + persist | settings and route in `localStorage` |
| Zod | validates every Open-Meteo response |
| Radix UI | dialog, slider, switch, toggle group, popover, tooltip |
| cmdk | address autocomplete |
| react-error-boundary | keeps a render error off the whole page |
| Recharts | ride-window chart (lazy-loaded — it is most of the bundle) |
| date-fns | wall-clock formatting |
| Lucide | icons |
| Sonner | toasts |

Every animation is CSS, not JavaScript. A tab that isn't receiving animation
frames — a background tab on load, a throttled renderer — would otherwise show
an invisible page, empty chart bars, and a score ring in the previous
verdict's colour. Nothing you need to read is gated on a `requestAnimationFrame`
callback arriving.

## Data

[Open-Meteo](https://open-meteo.com) — forecast, six-model consensus, air
quality and elevation. Free, keyless, no account. Requests are made in metric
and converted at render time, so switching units never refetches.

[Photon](https://photon.komoot.io) (Komoot's OpenStreetMap geocoder) — address
search and reverse lookup. Also keyless and CORS-enabled. Open-Meteo's own
geocoder stays as a town-level fallback if Photon is unreachable.

[Valhalla](https://valhalla1.openstreetmap.de) on FOSSGIS — bicycle routing.
Keyless and CORS-enabled. If it is unreachable the app says so and falls back
to a straight line with a 25% detour allowance.

Air-quality models stop about two days short of the weather forecast. Rather
than scoring those days as though the air were clean, the week view names the
day the data runs out.

Reverse geocoding is a real lookup, not a guess from the timezone: `Europe/Paris`
covers Strasbourg, Lyon and Brest, and an earlier version of this app called
all three of them Paris.

Settings and your route live in `localStorage`. Nothing is sent anywhere but
Open-Meteo. Geolocation is only requested when you ask for it.

## Keyboard

| Key | Does |
| --- | --- |
| `,` | open settings |
| `r` | refresh the forecast |
| `←` `→` | rotate the manual bearing dial (shift for 45°) |

## Layout

```
src/
  api/         Zod schemas, Open-Meteo clients, TanStack Query hooks
  model/       score, consensus, nowcast, kit, profiles, types — no React in here
  lib/         geo maths, units, wall-clock time, weather codes
  hooks/       useCommute: one hook, everything derived
  store/       Zustand settings
  components/  presentation, plus ui/ for Radix wrappers
```

A model, not a promise. Ice, traffic and your own legs are not in the forecast.
