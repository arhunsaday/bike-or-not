import type { ProfileKey } from '@/model/types'

const dec = (v: number, d = 1) => v.toFixed(d)

export const en = {
  locale: 'en-GB',
  documentTitle: 'bike or not — should you ride today?',

  app: {
    refresh: 'Refresh forecast',
    settings: 'Settings',
    routeUnavailable: 'Route service unavailable',
    routeUnavailableDetail:
      'Falling back to straight-line distance, so the climb and journey time are rougher than usual.',
    forecastError: 'Could not reach the forecast',
    tryAgain: 'Try again',
    sourcesBefore: 'Six-model consensus, air quality and elevation by',
    updated: (time: string) => `Updated ${time}.`,
    disclaimer: 'A model, not a promise. Ice, traffic and your own legs are not in the forecast.',
  },

  crash: {
    title: 'Something broke',
    body: 'The app hit an error it could not recover from on its own. Your settings and saved routes are untouched.',
    tryAgain: 'Try again',
    reload: 'Reload the page',
  },

  dialog: { close: 'Close' },

  days: {
    today: 'Today',
    todayShort: 'Today',
    tomorrow: 'Tomorrow',
    tomorrowShort: 'Tmrw',
  },

  /** Sixteen-point compass, clockwise from north. */
  compass: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
            'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
  cardinals: { n: 'N', e: 'E', s: 'S', w: 'W' },

  weather: {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Freezing fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    56: 'Freezing drizzle',
    57: 'Freezing drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light showers',
    81: 'Showers',
    82: 'Violent showers',
    85: 'Snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Storm with hail',
    99: 'Severe storm',
  } as Record<number, string>,
  weatherUnknown: 'Unknown',

  profiles: {
    fair: { label: 'Fair-weather', blurb: 'Bike when it is genuinely nice' },
    regular: { label: 'Regular', blurb: 'Bike most days, skip the worst' },
    all: { label: 'All-weather', blurb: 'Rain is just water' },
    hardened: { label: 'Hardened', blurb: 'Studded tyres. No excuses.' },
  } as Record<ProfileKey, { label: string; blurb: string }>,

  settings: {
    title: 'Your ride',
    description: 'Everything here changes the score, not just the display.',
    rider: 'Rider',
    riderHint: 'How much weather are you actually willing to eat?',
    times: 'Times',
    leaveHome: 'Leave home',
    headBack: 'Head back',
    speed: 'Cruising speed',
    direction: 'Direction out',
    directionHint:
      'No destination set, so tell us which way you point in the morning — this is what splits a wind into a shove and a wall. The ride home gets the opposite.',
    distance: 'Distance one way',
    gear: 'Bike & gear',
    fenders: 'Mudguards fitted',
    fendersHint: 'softens the penalty for light rain',
    lights: 'Lights on the bike',
    lightsHint: 'darkness costs 4 points instead of 24',
    ebike: "It's an e-bike",
    ebikeHint: 'halves headwinds, flattens hills',
    display: 'Display',
    units: 'Units',
    clock: 'Clock',
    theme: 'Theme',
    themeAuto: 'Auto',
    themeDark: 'Dark',
    themeLight: 'Light',
    language: 'Language',
    reset: 'Reset preferences',
    resetHint: 'Saved routes and past feedback are kept',
  },

  compassDial: {
    label: 'Outbound bearing',
    any: 'Any',
    unset: 'direction unset',
    clear: "I'd rather not say",
    hint: 'Without a bearing every wind is treated as half headwind, half cross.',
  },

  place: {
    myLocation: 'My location',
    locateFailed: 'Could not get your location',
    locating: 'Finding you…',
    useLocation: 'Use my current location',
    searching: 'Searching…',
    nothingFound: (q: string) => `Nothing found for “${q}”.`,
    searchPlaceholder: 'Street address, town or landmark…',
    typeMore: 'Type at least two letters — a street address works.',
    clear: (label: string) => `Clear ${label}`,
  },

  firstRun: {
    title: 'Where do you ride?',
    description: 'Every score here is built around your own commute.',
    orSearch: 'or search',
    placeholder: 'Your town, or a street address',
    typeMore: 'Two letters is enough to start.',
    searchInstead: 'Search for your town or street instead.',
    demo: (city: string) => `Just show me ${city} for now`,
  },
  demoCity: 'Copenhagen',

  route: {
    from: 'From',
    to: 'To',
    fromPlaceholder: 'Where you set off',
    toPlaceholder: "Where you're heading",
    swap: 'Swap start and destination',
    distanceRouted: 'Distance along an actual cycling route, from OpenStreetMap via Valhalla.',
    distanceStraight: 'Router unavailable — straight-line distance with a 25% allowance for real streets.',
    eachWay: 'each way',
    estimated: '(estimated)',
    segments: (n: number) =>
      `Wind is resolved across ${n} segments of the real route, not one average heading.`,
    bearingHint: 'The compass bearing you ride out on. The evening leg gets the reciprocal.',
    heading: 'heading',
    climbRouted:
      'Every metre climbed along the route, sampled at 48 points — not just the difference between the two ends. The ride home trades ascent for descent.',
    climbStraight:
      'Height difference between the two ends. Without a route we cannot see the hills in between.',
    measuring: 'measuring climb…',
    flat: 'essentially flat',
    descentOut: (drop: string) => `↓${drop} out`,
    noDestination:
      'Add a destination and every wind gets split into a shove and a wall — plus the real route, its climb and your journey time.',
  },

  saved: {
    saved: (name: string) => `Saved “${name}”`,
    remove: (name: string) => `Delete ${name}`,
    namePlaceholder: 'Name',
    save: 'Save route',
    saveThis: 'Save this route',
  },

  nowcast: {
    rainingEasing: (min: number) => `Raining now — easing in about ${min} minutes`,
    rainingSteady: 'Raining now, and not letting up within the hour',
    starting: (min: number) => `Rain starting in about ${min} minutes`,
    source: (peak: number) => `Radar nowcast · peak ${dec(peak)} mm/h`,
    now: 'now',
  },

  verdictCard: {
    sunset: 'Sunset',
    sunrise: 'Sunrise',
    minutes: (a: number, b: number) => (a === b ? `${a} min` : `${a}–${b} min`),
    climbing: (elev: string) => `${elev} of climbing`,
    onTheBike: 'On the bike',
    atSpeed: (speed: string) => `at ${speed}`,
    wind: 'Wind',
    gusts: (n: number) => `gusts ${n}`,
    rainChance: 'Rain chance',
    rainForecast: (mm: number) => `${dec(mm)} mm/h forecast`,
    air: 'Air quality',
    aqi: (scale: string) => `${scale} AQI`,
    beyondForecast: 'beyond forecast',
    visibility: 'Visibility',
    km: (km: number) => `${dec(km, 0)} km`,
  },

  leg: {
    out: 'Out',
    back: 'Back',
    toWork: 'to work',
    homeAgain: 'home again',
    kind: {
      wind: 'wind',
      headwind: 'headwind',
      tailwind: 'tailwind',
      crosswind: 'crosswind',
    },
    windOf: (speed: string, kind: string) => `${speed} ${kind}`,
    fromDir: (dir: string) => `from the ${dir}`,
    splitHint: 'add a destination to split it',
    across: (n: number) => `, ${n} across`,
    shiftLead: (delta: number) =>
      `Leave ${Math.abs(delta) === 1 ? 'an hour' : `${Math.abs(delta)} hours`} ${delta < 0 ? 'earlier' : 'later'}, at `,
    shiftMid: ', and this leg scores ',
    shiftTail: (gain: number) => ` — ${gain} points better.`,
  },

  factors: {
    clear: 'Clear',
    nothingAgainst: 'nothing against you',
  },

  windRose: {
    label: 'Wind relative to your direction of travel',
    noBearing: 'no bearing set',
    riding: (dir: string) => `riding ${dir}`,
  },

  ring: {
    label: (n: number) => `Bikeability ${n} out of 100`,
    caption: 'bikeability',
  },

  rideWindow: {
    title: 'Ride window',
    now: 'now',
    rightNow: 'Right now',
    hourly: 'Scored hour by hour.',
    whenToday: 'left today',
    whenTomorrow: 'tomorrow',
    whenDay: (day: string) => `on ${day}`,
    nothingToday: 'Nothing good left today — check tomorrow morning.',
    noWindow: (when: string) => `No good window ${when}.`,
    midnight: 'midnight',
    bestHour: (when: string, at: string, avg: number) => `Best hour ${when}: around ${at} (${avg}/100).`,
    bestStretch: (when: string, from: string, to: string, avg: number) =>
      `Best stretch ${when}: ${from}–${to}, averaging ${avg}/100.`,
    dont: "don't",
    marginal: 'marginal',
    go: 'go',
    legend: 'Outlined bars are your commute hours. Bars are scored for your outbound direction.',
  },

  kitList: {
    title: 'Pack this',
    note: (out: number, back: number) =>
      `Sized for the colder leg · ≈${out} min out, ${back} min back`,
  },

  week: {
    title: 'Week ahead',
    note: 'Scored for your commute hours, both legs.',
    airUntil: (day: string) =>
      `Air quality is only forecast to ${day} — later days are scored without it.`,
  },

  feedback: {
    ask: 'How did that ride actually go?',
    thanks: 'Thanks — noted for next time.',
    harsh: { label: 'Better than it said', short: 'Better' },
    right: { label: 'About right', short: 'Spot on' },
    optimistic: { label: 'Worse than it said', short: 'Worse' },
  },

  tiers: [
    ['Send it', 'Textbook commuting weather'],
    ['Ride it', 'Nothing out there to stop you'],
    ['Kit up', 'Rideable with the right layers'],
    ['Your call', 'Doable, but you will feel it'],
    ['Rough one', 'Only if you really want to'],
    ['Not today', 'Take the bus and keep your dignity'],
  ] as [string, string][],
  /** For the week strip, where a tile is about five characters wide. */
  tiersShort: ['Send it', 'Ride it', 'Kit up', 'Your call', 'Rough one', 'Not today'],
  verdictSub: (label: string, note: string) => `${label.toLowerCase()} — ${note}`,

  score: {
    cold: 'Cold',
    feelsAtSpeed: (feel: number, speed: number) => `feels like ${feel}° at ${speed} km/h`,
    heat: 'Heat',
    humid: (feel: number) => `${feel}° and humid`,
    feels: (feel: number) => `feels like ${feel}°`,
    rain: 'Rain',
    snow: 'Snow',
    snowCm: (cm: number) => `${dec(cm)} cm of snow`,
    modelsSayRain: (wet: number, of: number) => `${wet} of ${of} models say rain`,
    chanceMm: (pct: number, mm: number) => `${pct}% chance, ${dec(mm)} mm/h`,
    chance: (pct: number) => `${pct}% chance of rain`,
    damp: 'Wet roads',
    dampNote: 'recent rain, surfaces still slick',
    wind: 'Wind',
    tailwind: 'Tailwind',
    headwindNote: (n: number) => `${n} km/h headwind`,
    tailwindNote: (n: number) => `${n} km/h tailwind`,
    gustNote: (n: number) => `gusting to ${n} km/h`,
    crossNote: (n: number) => `${n} km/h crosswind`,
    blustery: 'blustery',
    climb: 'Climb',
    climbNote: (m: number, grade: number) => `${m} m of climbing at ${dec(grade)}%`,
    descent: 'Descent',
    descentNote: (m: number) => `${m} m of free height`,
    dark: 'Darkness',
    darkLit: 'dark, but you have lights',
    darkUnlit: 'dark and you have no lights',
    vis: 'Visibility',
    visNote: (km: number) => `only ${dec(km)} km of it`,
    air: 'Air quality',
    uv: 'UV',
    uvNote: (n: number) => `UV index ${dec(n, 0)}`,
    ice: 'Ice risk',
    iceNote: (t: number) => `${dec(t, 0)}° with moisture on the road`,
    storm: 'Thunderstorms in the area',
    heavySnow: 'Heavy snowfall',
    blackIce: 'Black-ice conditions',
    gusts: (n: number) => `Dangerous gusts (${n} km/h)`,
    fog: 'Near-zero visibility',
  },

  confidence: {
    allDry: (n: number) => `All ${n} models say dry`,
    allRain: (n: number) => `All ${n} models say rain`,
    some: (wet: number, n: number) => `${wet} of ${n} models expect rain`,
    bothLegs: ' on both legs',
    lessCertain: (wet: number, n: number) =>
      ` on the less certain leg (${wet} of ${n} on the other)`,
    spread: (temp: number, wind: number) => `Spread across models: ${dec(temp)}° and ${wind} km/h.`,
    checked: (names: string) => `Checked against ${names}.`,
  },

  kit: {
    fullWinter: ['Full winter kit', 'thermal base, windproof outer'],
    lobster: ['Lobster gloves', 'fingers go first'],
    balaclava: ['Balaclava or thick buff', 'cover the ears'],
    overshoes: ['Overshoes', 'shoe vents leak cold'],
    winterJacket: ['Winter jacket', 'windproof front, breathable back'],
    fullFinger: ['Full-finger gloves', ''],
    earCover: ['Ear cover and buff', ''],
    thermalSocks: ['Thermal socks', ''],
    thermalLong: ['Thermal long sleeve', 'plus a wind shell'],
    lightGloves: ['Light gloves', ''],
    tights: ['Long tights', ''],
    longSleeves: ['Long sleeves', 'or arm warmers you can strip'],
    windproof: ['Light windproof', 'packs down to nothing'],
    lightLong: ['Light long sleeve', 'you will warm up in ten minutes'],
    shortSleeves: ['Short sleeves', 'ideal riding temperature'],
    lightest: ['Lightest kit you own', 'breathable everything'],
    extraBottle: ['Extra bottle', 'and drink before you are thirsty'],
    sunscreen: ['Sunscreen', ''],
    waterproofGloves: ['Waterproof gloves', 'wet hands in snow is misery'],
    tyrePressure: ['Drop your tyre pressure', 'more grip on slush'],
    rainJacket: ['Proper rain jacket', 'taped seams, not "water resistant"'],
    overtrousers: ['Waterproof overtrousers', ''],
    shoeCovers: ['Shoe covers', 'wet socks last all day'],
    cap: ['Cap under the helmet', 'keeps rain out of your eyes'],
    dryBag: ['Dry-bag the laptop', 'bag covers are not seals'],
    shell: ['Packable shell', 'in the bag, not on your back'],
    bagCover: ['Bag rain cover', 'or a liner, if you have one'],
    mudguards: ['Fit mudguards', 'the stripe up your back is optional'],
    getLow: ['Get low and small', 'hands on the drops or hoods'],
    gaps: ['Watch gaps between buildings', 'gusts hit hardest at junctions and bridges'],
    gearDown: 'Gear down early',
    gearDownNote: (m: number, grade: number) => `${m} m net climb at ${dec(grade)}%`,
    chargeLights: ['Charge your lights', 'check them before you go'],
    needLights: ['You need lights', 'legally and practically'],
    reflective: ['Something reflective', 'ankles move — drivers notice movement'],
    uvNote: (n: number) => `UV index ${n}`,
    sunglasses: ['Sunglasses', 'low sun plus grit'],
    quietRoute: 'Pick the quiet route',
    quietRouteNote: (pm: number) => `PM2.5 is ${pm} µg/m³ — stay off the arterials`,
    studs: ['Studded tyres or stay home', 'ice does not care how good you are'],
    water: 'Water bottle',
    waterHot: 'you will sweat more than you think',
    waterLong: 'it is a long enough ride',
    food: ['Something to eat', 'an hour of riding a day adds up'],
    swing: (deg: number) => `${deg}° swing between legs — pack something you can shed.`,
    wetRoads: 'Roads are still wet from earlier — go easy on painted lines and tram rails.',
    headwind: (n: number) => `Up to ${n} km/h of headwind on one leg — leave a few minutes early.`,
    shirtChange: 'That grade is a shirt-change on arrival, not a nice-to-have.',
  } as const,
}

type Widen<T> =
  T extends string ? string
    : T extends (...args: infer A) => infer R ? (...args: A) => Widen<R>
      : T extends readonly [string, string] ? readonly [string, string]
        : T extends object ? { [K in keyof T]: Widen<T[K]> }
          : T

export type Messages = Widen<typeof en>
