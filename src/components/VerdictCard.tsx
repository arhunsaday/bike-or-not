import {
  Bike,
  Clock,
  Droplets,
  Eye,
  Layers,
  Leaf,
  Mountain,
  Sunrise,
  Sunset,
  Thermometer,
  TriangleAlert,
  Wind,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { compassPoint } from "@/lib/geo";
import { dayLabel, fmtClock } from "@/lib/time";
import {
  fmtDist,
  fmtElevation,
  fmtSpeed,
  fmtTemp,
  scoreColor,
} from "@/lib/units";
import { weatherIcon, weatherInfo } from "@/lib/weather-codes";
import { topFactor, verdict, type RouteGeometry } from "@/model/score";
import type {
  Commute,
  DayRecord,
  RideSettings,
  WeatherModel,
} from "@/model/types";
import type { Confidence } from "@/model/consensus";
import { ScoreRing } from "./ScoreRing";
import { Tooltip } from "./ui/Tooltip";
import { Card } from "./ui/Card";

interface Props {
  model: WeatherModel;
  commute: Commute;
  settings: RideSettings;
  geo: RouteGeometry;
  placeLabel: string;
  day?: DayRecord;
  confidence: Confidence | null;
}

export function VerdictCard({
  model,
  commute,
  settings,
  geo,
  placeLabel,
  day,
  confidence,
}: Props) {
  const v = verdict(commute.combined, commute.blockers, topFactor(commute));
  const colour = scoreColor(commute.combined);
  const out = commute.out.rec;
  const info = weatherInfo(out.code);
  const WeatherIcon = weatherIcon(info.group, out.isDay);
  const sun = out.isDay
    ? { Icon: Sunset, label: "Sunset", at: day?.sunset }
    : { Icon: Sunrise, label: "Sunrise", at: day?.sunrise };

  const fastest = Math.min(commute.out.minutes, commute.back.minutes);
  const slowest = Math.max(commute.out.minutes, commute.back.minutes);

  return (
    <Card className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 overflow-hidden sm:gap-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[60%] -right-[30%] aspect-square w-3/5 opacity-[0.16] transition-[background] duration-700"
        style={{
          background: `radial-gradient(circle, ${colour}, transparent 68%)`,
        }}
      />

      <div className="min-w-0">
        {/* Wraps rather than truncates: "1 Rue Saglio → 6 Rue Eugénie Brazier"
            clipped to "1 …" tells the reader nothing. */}
        <p className="flex flex-wrap items-center gap-x-2 text-[0.78rem] font-semibold uppercase tracking-[0.09em] text-ink-3">
          <span>{placeLabel}</span>
          <span className="flex items-center gap-2">
            <i className="not-italic opacity-50">·</i>
            {dayLabel(commute.date, model.today, true)}
          </span>
        </p>

        {/* Keyed so a new verdict replays the reveal; CSS so it never depends
            on animation frames arriving. */}
        <h1
          key={v.word}
          className="verdict-in score-ink my-2 font-display text-[clamp(2.9rem,9vw,5.1rem)] font-extrabold leading-[0.94] tracking-[-0.035em] text-balance"
          style={{ color: colour, fontVariationSettings: "'wdth' 122" }}
        >
          {v.word}
        </h1>

        <p className="max-w-[34ch] text-[clamp(0.95rem,1.6vw,1.08rem)] text-ink-2 text-pretty first-letter:uppercase">
          {v.sub}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Chip icon={<Clock size={14} />}>
            {fmtClock(settings.outTime, settings.clock12)} →{" "}
            {fmtClock(settings.backTime, settings.clock12)}
          </Chip>
          <Chip icon={<Bike size={14} />}>
            {fastest === slowest
              ? `${fastest} min`
              : `${fastest}–${slowest} min`}
            {" · "}
            {fmtDist(geo.distanceKm, settings.units)}
          </Chip>
          {geo.ascentM >= 15 && (
            <Chip icon={<Mountain size={14} />}>
              {fmtElevation(geo.ascentM, settings.units)} of climbing
            </Chip>
          )}
          {confidence && (
            <Tooltip label={confidence.detail}>
              <span>
                <Chip
                  icon={<Layers size={14} />}
                  tone={confidence.level === "low" ? "warn" : "neutral"}
                >
                  {confidence.headline}
                </Chip>
              </span>
            </Tooltip>
          )}
          {commute.blockers.map((b) => (
            <Chip key={b} icon={<TriangleAlert size={14} />} tone="bad">
              {b}
            </Chip>
          ))}
        </div>
      </div>

      <ScoreRing score={commute.combined} />

      <ul className="col-span-2 mt-1 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line-soft pt-4 sm:grid-cols-3 lg:grid-cols-6">
        <Condition
          Icon={WeatherIcon}
          k={info.label}
          v={fmtTemp(out.temp, settings.units)}
        />
        <Condition
          Icon={Thermometer}
          k="On the bike"
          v={fmtTemp(commute.out.feel, settings.units)}
          sub={`at ${settings.speedKmh} km/h`}
        />
        <Condition
          Icon={Wind}
          k="Wind"
          v={fmtSpeed(out.wind, settings.units)}
          sub={`${compassPoint(out.windDir)}${out.gust > out.wind + 8 ? ` · gusts ${Math.round(out.gust)}` : ""}`}
        />
        <Condition
          Icon={Droplets}
          k="Rain chance"
          v={`${Math.round(out.precipProb)}%`}
          sub={`${out.precip.toFixed(1)} mm/h forecast`}
        />
        {/* Say when there is no air-quality forecast rather than quietly
            swapping in a different measurement. */}
        {out.aqi != null ? (
          <Condition
            Icon={Leaf}
            k="Air quality"
            v={String(Math.round(out.aqi))}
            sub={`${out.aqiScale} AQI`}
          />
        ) : (
          <Condition Icon={Leaf} k="Air quality" v="–" sub="beyond forecast" />
        )}
        <Condition
          Icon={Eye}
          k="Visibility"
          v={out.vis != null ? `${(out.vis / 1000).toFixed(0)} km` : "–"}
        />
        {/* {sun.at && (
          <Condition Icon={sun.Icon} k={sun.label}
                     v={fmtClock(sun.at.slice(11, 16), settings.clock12)} />
        )} */}
      </ul>
    </Card>
  );
}

const CHIP_TONES = {
  neutral: "border-line-soft bg-card-2 text-ink-2",
  warn: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  bad: "border-rose-400/30 bg-rose-400/10 text-rose-300",
} as const;

function Chip({
  icon,
  children,
  tone = "neutral",
}: {
  icon: ReactNode;
  children: ReactNode;
  tone?: keyof typeof CHIP_TONES;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[0.82rem]",
        CHIP_TONES[tone],
      )}
    >
      <span className="opacity-75">{icon}</span>
      {children}
    </span>
  );
}

function Condition({
  Icon,
  k,
  v,
  sub,
}: {
  Icon: typeof Wind;
  k: string;
  v: string;
  sub?: string;
}) {
  return (
    <li className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.07em] text-ink-3">
        <Icon size={14} />
        <span className="truncate">{k}</span>
      </span>
      <span className="text-[1.02rem] font-semibold tracking-tight">{v}</span>
      {sub && <span className="text-[0.75rem] text-ink-3">{sub}</span>}
    </li>
  );
}
