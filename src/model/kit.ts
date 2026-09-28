/*
 * What to actually put on and take with you.
 *
 * Advice keys off ride-feel temperature — wind chill at riding speed — not the
 * thermometer. 8 °C into a 25 km/h headwind is a different garment decision
 * from 8 °C on a still morning.
 */

import {
  Backpack, Bike, CloudRain, Droplets, Eye, Footprints, Glasses, GlassWater, Leaf,
  Lightbulb, Mountain, Sandwich, Shirt, Snowflake, Sun, TriangleAlert, Umbrella, Wind,
  type LucideIcon,
} from 'lucide-react'
import { messages, type Messages } from '@/i18n'
import type { Commute, RideSettings } from './types'

export type KitTone = 'neutral' | 'warn' | 'bad'

export interface KitItem {
  icon: LucideIcon
  label: string
  note: string
  tone: KitTone
}

type KitKey = { [K in keyof Messages['kit']]: Messages['kit'][K] extends readonly [string, string] ? K : never }[keyof Messages['kit']]
type Layer = { max: number; items: [LucideIcon, KitKey][] }

const LAYERS: Layer[] = [
  { max: -2, items: [
    [Shirt, 'fullWinter'],
    [Snowflake, 'lobster'],
    [Shirt, 'balaclava'],
    [Footprints, 'overshoes'],
  ] },
  { max: 4, items: [
    [Shirt, 'winterJacket'],
    [Shirt, 'fullFinger'],
    [Shirt, 'earCover'],
    [Footprints, 'thermalSocks'],
  ] },
  { max: 9, items: [
    [Shirt, 'thermalLong'],
    [Shirt, 'lightGloves'],
    [Shirt, 'tights'],
  ] },
  { max: 14, items: [
    [Shirt, 'longSleeves'],
    [Wind, 'windproof'],
  ] },
  { max: 20, items: [
    [Shirt, 'lightLong'],
  ] },
  { max: 26, items: [
    [Shirt, 'shortSleeves'],
  ] },
  { max: 99, items: [
    [Shirt, 'lightest'],
    [GlassWater, 'extraBottle'],
    [Sun, 'sunscreen'],
  ] },
]

export interface KitAdvice {
  kit: KitItem[]
  notes: string[]
}

export function buildKit(c: Commute, s: RideSettings): KitAdvice {
  const kit: KitItem[] = []
  const notes: string[] = []
  const seen = new Set<string>()
  const m = messages(s.lang).kit
  const push = (icon: LucideIcon, label: string, note: string, tone: KitTone = 'neutral') => {
    if (seen.has(label)) return
    seen.add(label)
    kit.push({ icon, label, note, tone })
  }
  const item = (icon: LucideIcon, key: KitKey, tone: KitTone = 'neutral') => {
    const [label, note] = m[key]
    push(icon, label, note, tone)
  }

  const legs = [c.out, c.back]
  const recs = legs.map((l) => l.rec)
  const coldest = Math.min(...legs.map((l) => l.feel))
  const hottest = Math.max(...legs.map((l) => l.feel))
  const longest = Math.max(...legs.map((l) => l.minutes))

  /* layers, sized to the colder leg */
  const band = LAYERS.find((b) => coldest <= b.max) ?? LAYERS[LAYERS.length - 1]
  for (const [icon, key] of band.items) item(icon, key)
  if (hottest - coldest > 8) {
    notes.push(m.swing(Math.round(hottest - coldest)))
  }

  /* precipitation */
  const wettest = Math.max(...recs.map((r) => r.precip))
  const rainiest = Math.max(...recs.map((r) => r.precipProb))
  if (recs.some((r) => r.snow > 0)) {
    item(Snowflake, 'waterproofGloves', 'warn')
    item(Bike, 'tyrePressure', 'warn')
  }
  if (wettest >= 1.2 || (rainiest >= 70 && wettest >= 0.4)) {
    item(CloudRain, 'rainJacket', 'warn')
    item(Umbrella, 'overtrousers')
    item(Footprints, 'shoeCovers', 'warn')
    item(Shirt, 'cap')
    item(Backpack, 'dryBag', 'warn')
  } else if (rainiest >= 35 || wettest > 0.05) {
    item(CloudRain, 'shell')
    item(Backpack, 'bagCover')
  }
  if (!s.fenders && (wettest > 0.05 || recs.some((r) => r.wet3 > 0.5))) {
    item(Bike, 'mudguards', 'warn')
  }
  if (recs.some((r) => r.wet3 > 0.3) && wettest <= 0.05) {
    notes.push(m.wetRoads)
  }

  /* wind */
  const maxHead = Math.max(...legs.map((l) => l.wind.head))
  if (maxHead > 18) {
    item(Wind, 'getLow', 'warn')
    notes.push(m.headwind(Math.round(maxHead)))
  }
  if (Math.max(...recs.map((r) => r.gust)) >= 45) {
    item(TriangleAlert, 'gaps', 'warn')
  }

  /* gradient */
  const climb = Math.max(...legs.map((l) => l.ascentM))
  const steepest = Math.max(...legs.map((l) => l.gradient))
  if (steepest >= 1.5) {
    push(Mountain, m.gearDown, m.gearDownNote(Math.round(climb), steepest), 'warn')
    if (!s.ebike && steepest >= 2.5) {
      notes.push(m.shirtChange)
    }
  }

  /* light */
  if (legs.some((l) => !l.rec.isDay)) {
    if (s.lights) item(Lightbulb, 'chargeLights')
    else item(Lightbulb, 'needLights', 'bad')
    item(Eye, 'reflective')
  }

  /* sun and air */
  const uv = Math.max(...recs.map((r) => r.uv))
  if (uv >= 6) {
    push(Sun, m.sunscreen[0], m.uvNote(Math.round(uv)))
    item(Glasses, 'sunglasses')
  }
  const pm = Math.max(...recs.map((r) => r.pm25 ?? 0))
  if (pm >= 25) {
    push(Leaf, m.quietRoute, m.quietRouteNote(Math.round(pm)), 'warn')
  }

  /* ice */
  if (legs.some((l) => l.factors.some((f) => f.key === 'ice'))) {
    item(TriangleAlert, 'studs', 'bad')
  }

  /* effort and duration */
  if (hottest >= 22 || longest >= 30) {
    push(Droplets, m.water, hottest >= 22 ? m.waterHot : m.waterLong)
  }
  if (longest >= 35 && !s.ebike) {
    item(Sandwich, 'food')
  }

  return { kit, notes }
}
