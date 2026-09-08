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
import type { Commute, RideSettings } from './types'

export type KitTone = 'neutral' | 'warn' | 'bad'

export interface KitItem {
  icon: LucideIcon
  label: string
  note: string
  tone: KitTone
}

type Layer = { max: number; items: [LucideIcon, string, string][] }

const LAYERS: Layer[] = [
  { max: -2, items: [
    [Shirt, 'Full winter kit', 'thermal base, windproof outer'],
    [Snowflake, 'Lobster gloves', 'fingers go first'],
    [Shirt, 'Balaclava or thick buff', 'cover the ears'],
    [Footprints, 'Overshoes', 'shoe vents leak cold'],
  ] },
  { max: 4, items: [
    [Shirt, 'Winter jacket', 'windproof front, breathable back'],
    [Shirt, 'Full-finger gloves', ''],
    [Shirt, 'Ear cover and buff', ''],
    [Footprints, 'Thermal socks', ''],
  ] },
  { max: 9, items: [
    [Shirt, 'Thermal long sleeve', 'plus a wind shell'],
    [Shirt, 'Light gloves', ''],
    [Shirt, 'Long tights', ''],
  ] },
  { max: 14, items: [
    [Shirt, 'Long sleeves', 'or arm warmers you can strip'],
    [Wind, 'Light windproof', 'packs down to nothing'],
  ] },
  { max: 20, items: [
    [Shirt, 'Light long sleeve', 'you will warm up in ten minutes'],
  ] },
  { max: 26, items: [
    [Shirt, 'Short sleeves', 'ideal riding temperature'],
  ] },
  { max: 99, items: [
    [Shirt, 'Lightest kit you own', 'breathable everything'],
    [GlassWater, 'Extra bottle', 'and drink before you are thirsty'],
    [Sun, 'Sunscreen', ''],
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
  const push = (icon: LucideIcon, label: string, note: string, tone: KitTone = 'neutral') => {
    if (seen.has(label)) return
    seen.add(label)
    kit.push({ icon, label, note, tone })
  }

  const legs = [c.out, c.back]
  const recs = legs.map((l) => l.rec)
  const coldest = Math.min(...legs.map((l) => l.feel))
  const hottest = Math.max(...legs.map((l) => l.feel))
  const longest = Math.max(...legs.map((l) => l.minutes))

  /* layers, sized to the colder leg */
  const band = LAYERS.find((b) => coldest <= b.max) ?? LAYERS[LAYERS.length - 1]
  for (const [icon, label, note] of band.items) push(icon, label, note)
  if (hottest - coldest > 8) {
    notes.push(`${Math.round(hottest - coldest)}° swing between legs — pack something you can shed.`)
  }

  /* precipitation */
  const wettest = Math.max(...recs.map((r) => r.precip))
  const rainiest = Math.max(...recs.map((r) => r.precipProb))
  if (recs.some((r) => r.snow > 0)) {
    push(Snowflake, 'Waterproof gloves', 'wet hands in snow is misery', 'warn')
    push(Bike, 'Drop your tyre pressure', 'more grip on slush', 'warn')
  }
  if (wettest >= 1.2 || (rainiest >= 70 && wettest >= 0.4)) {
    push(CloudRain, 'Proper rain jacket', 'taped seams, not "water resistant"', 'warn')
    push(Umbrella, 'Waterproof overtrousers', '')
    push(Footprints, 'Shoe covers', 'wet socks last all day', 'warn')
    push(Shirt, 'Cap under the helmet', 'keeps rain out of your eyes')
    push(Backpack, 'Dry-bag the laptop', 'bag covers are not seals', 'warn')
  } else if (rainiest >= 35 || wettest > 0.05) {
    push(CloudRain, 'Packable shell', 'in the bag, not on your back')
    push(Backpack, 'Bag rain cover', 'or a liner, if you have one')
  }
  if (!s.fenders && (wettest > 0.05 || recs.some((r) => r.wet3 > 0.5))) {
    push(Bike, 'Fit mudguards', 'the stripe up your back is optional', 'warn')
  }
  if (recs.some((r) => r.wet3 > 0.3) && wettest <= 0.05) {
    notes.push('Roads are still wet from earlier — go easy on painted lines and tram rails.')
  }

  /* wind */
  const maxHead = Math.max(...legs.map((l) => l.wind.head))
  if (maxHead > 18) {
    push(Wind, 'Get low and small', 'hands on the drops or hoods', 'warn')
    notes.push(`Up to ${Math.round(maxHead)} km/h of headwind on one leg — leave a few minutes early.`)
  }
  if (Math.max(...recs.map((r) => r.gust)) >= 45) {
    push(TriangleAlert, 'Watch gaps between buildings', 'gusts hit hardest at junctions and bridges', 'warn')
  }

  /* gradient */
  const climb = Math.max(...legs.map((l) => l.ascentM))
  const steepest = Math.max(...legs.map((l) => l.gradient))
  if (steepest >= 1.5) {
    push(Mountain, 'Gear down early', `${Math.round(climb)} m net climb at ${steepest.toFixed(1)}%`, 'warn')
    if (!s.ebike && steepest >= 2.5) {
      notes.push('That grade is a shirt-change on arrival, not a nice-to-have.')
    }
  }

  /* light */
  if (legs.some((l) => !l.rec.isDay)) {
    push(Lightbulb, s.lights ? 'Charge your lights' : 'You need lights',
      s.lights ? 'check them before you go' : 'legally and practically',
      s.lights ? 'neutral' : 'bad')
    push(Eye, 'Something reflective', 'ankles move — drivers notice movement')
  }

  /* sun and air */
  const uv = Math.max(...recs.map((r) => r.uv))
  if (uv >= 6) {
    push(Sun, 'Sunscreen', `UV index ${Math.round(uv)}`)
    push(Glasses, 'Sunglasses', 'low sun plus grit')
  }
  const pm = Math.max(...recs.map((r) => r.pm25 ?? 0))
  if (pm >= 25) {
    push(Leaf, 'Pick the quiet route', `PM2.5 is ${Math.round(pm)} µg/m³ — stay off the arterials`, 'warn')
  }

  /* ice */
  if (legs.some((l) => l.factors.some((f) => f.key === 'ice'))) {
    push(TriangleAlert, 'Studded tyres or stay home', 'ice does not care how good you are', 'bad')
  }

  /* effort and duration */
  if (hottest >= 22 || longest >= 30) {
    push(Droplets, 'Water bottle',
      hottest >= 22 ? 'you will sweat more than you think' : 'it is a long enough ride')
  }
  if (longest >= 35 && !s.ebike) {
    push(Sandwich, 'Something to eat', 'an hour of riding a day adds up')
  }

  return { kit, notes }
}
