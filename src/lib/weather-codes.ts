import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow,
  CloudSun, Moon, Sun, type LucideIcon,
} from 'lucide-react'
import type { Messages } from '@/i18n'

export type ConditionGroup =
  | 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle'
  | 'rain' | 'showers' | 'snow' | 'freezing' | 'storm'

/** Condition names live in the i18n messages, keyed by the same WMO code. */
const WMO: Record<number, ConditionGroup> = {
  0: 'clear',
  1: 'clear',
  2: 'partly',
  3: 'cloudy',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'freezing',
  57: 'freezing',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  66: 'freezing',
  67: 'freezing',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  80: 'showers',
  81: 'showers',
  82: 'showers',
  85: 'snow',
  86: 'snow',
  95: 'storm',
  96: 'storm',
  99: 'storm',
}

export function weatherInfo(code: number, m: Messages) {
  const group = WMO[code] ?? 'cloudy'
  return { label: m.weather[code] ?? m.weatherUnknown, group, code }
}

export const weatherGroup = (code: number): ConditionGroup => WMO[code] ?? 'cloudy'

export function weatherIcon(group: ConditionGroup, isDay = true): LucideIcon {
  switch (group) {
    case 'clear': return isDay ? Sun : Moon
    case 'partly': return isDay ? CloudSun : CloudMoon
    case 'fog': return CloudFog
    case 'drizzle': return CloudDrizzle
    case 'rain':
    case 'showers': return CloudRain
    case 'snow':
    case 'freezing': return CloudSnow
    case 'storm': return CloudLightning
    default: return Cloud
  }
}

/** Palette the page takes on, so the UI matches what is out the window. */
const SKIES: Record<string, { dark: [string, string, string]; light: [string, string, string] }> = {
  clearDay:   { dark: ['#1b3a6b', '#080c17', '#2a5b9e'], light: ['#cfe3ff', '#f3f7fd', '#b9d6ff'] },
  clearNight: { dark: ['#141b3a', '#05070f', '#1e2a55'], light: ['#d6dcf0', '#f2f4fb', '#c3cbe8'] },
  cloudy:     { dark: ['#232a3d', '#0a0d15', '#333b52'], light: ['#dde2ee', '#f3f5fa', '#ccd4e4'] },
  rain:       { dark: ['#1a2536', '#070a11', '#24384f'], light: ['#d3dde9', '#eff3f8', '#bfcede'] },
  snow:       { dark: ['#26304a', '#0a0e18', '#3b4767'], light: ['#e2e8f5', '#f5f7fc', '#d3dcf0'] },
  storm:      { dark: ['#2a1f3c', '#080610', '#3d2a4f'], light: ['#ded6ec', '#f4f1f9', '#cec2e2'] },
  fog:        { dark: ['#2b3040', '#0c0f15', '#3a4050'], light: ['#dfe2e9', '#f4f5f8', '#ced3dd'] },
}

export function skyPalette(group: ConditionGroup, isDay: boolean, dark: boolean) {
  const key =
    group === 'storm' ? 'storm'
      : group === 'snow' || group === 'freezing' ? 'snow'
        : group === 'rain' || group === 'showers' || group === 'drizzle' ? 'rain'
          : group === 'fog' ? 'fog'
            : group === 'cloudy' ? 'cloudy'
              : isDay ? 'clearDay' : 'clearNight'
  return SKIES[key][dark ? 'dark' : 'light']
}

export const isWet = (g: ConditionGroup) =>
  g === 'rain' || g === 'showers' || g === 'drizzle' || g === 'storm'
export const isSnowy = (g: ConditionGroup) => g === 'snow' || g === 'freezing'
