import type { ProfileKey } from './types'

/** Names and blurbs are in the i18n messages. */
export interface RideProfile {
  /** Comfortable ride-feel band in °C. */
  band: [number, number]
  /** Tolerance divisors — larger means less bothered. */
  cold: number
  heat: number
  rain: number
  wind: number
  hill: number
  dark: number
}

export const PROFILES: Record<ProfileKey, RideProfile> = {
  fair: {
    band: [15, 26], cold: 0.65, heat: 0.7, rain: 0.55, wind: 0.7, hill: 0.7, dark: 1.3,
  },
  regular: {
    band: [11, 25], cold: 1, heat: 1, rain: 1, wind: 1, hill: 1, dark: 1,
  },
  all: {
    band: [6, 28], cold: 1.6, heat: 1.3, rain: 1.7, wind: 1.4, hill: 1.3, dark: 0.8,
  },
  hardened: {
    band: [0, 31], cold: 2.4, heat: 1.6, rain: 2.6, wind: 1.9, hill: 1.7, dark: 0.6,
  },
}
