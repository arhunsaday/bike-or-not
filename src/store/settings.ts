import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { detectLang } from '@/i18n/detect'
import type { Place } from '@/lib/geo'
import type { RideSettings } from '@/model/types'

export const DEFAULTS: RideSettings = {
  from: null,
  to: null,
  manualBearing: null,
  manualDistanceKm: 8,
  outTime: '08:00',
  backTime: '17:30',
  speedKmh: 18,
  profile: 'regular',
  units: 'metric',
  clock12: false,
  theme: 'auto',
  // Picked up once from the browser; after that it is the rider's choice.
  lang: detectLang(),
  fenders: true,
  lights: true,
  ebike: false,
}

/** Somewhere to point the camera until the rider tells us where they ride. */
export const DEMO_POINT = { lat: 55.6759, lon: 12.5655 }

export interface SavedRoute {
  id: string
  name: string
  from: Place
  to: Place
}

export type FeedbackAnswer = 'harsh' | 'right' | 'optimistic'

export interface RideFeedback {
  /** The commute date the verdict was for. */
  date: string
  routeId: string
  verdict: string
  score: number
  answer: FeedbackAnswer
  at: number
}

interface SettingsStore extends RideSettings {
  routes: SavedRoute[]
  feedback: RideFeedback[]
  /** Whether we have already asked where the rider rides. Asked once, never nagged. */
  locationAsked: boolean

  patch: (next: Partial<RideSettings>) => void
  setEndpoint: (which: 'from' | 'to', place: Place | null) => void
  swapRoute: () => void
  resetPreferences: () => void

  saveCurrentRoute: (name: string) => void
  loadRoute: (id: string) => void
  deleteRoute: (id: string) => void

  recordFeedback: (entry: Omit<RideFeedback, 'at'>) => void
  markLocationAsked: () => void
}

/** Identifies the current route for feedback, without needing it to be saved. */
export const routeKey = (s: Pick<RideSettings, 'from' | 'to'>) =>
  `${s.from?.id ?? 'none'}>${s.to?.id ?? 'none'}`

export const useSettings = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      routes: [],
      feedback: [],
      locationAsked: false,

      patch: (next) => set(next),
      setEndpoint: (which, place) => set({ [which]: place } as Partial<RideSettings>),
      swapRoute: () => set((s) => ({ from: s.to, to: s.from })),

      // Saved routes and past feedback are the rider's own data, not a
      // preference, so resetting preferences leaves them alone.
      resetPreferences: () => set(DEFAULTS),

      saveCurrentRoute: (name) => {
        const { from, to, routes } = get()
        if (!from || !to) return
        const id = routeKey({ from, to })
        set({
          routes: [
            { id, name: name.trim() || `${from.name} → ${to.name}`, from, to },
            ...routes.filter((r) => r.id !== id),
          ].slice(0, 12),
        })
      },

      loadRoute: (id) => {
        const found = get().routes.find((r) => r.id === id)
        if (found) set({ from: found.from, to: found.to })
      },

      deleteRoute: (id) => set((s) => ({ routes: s.routes.filter((r) => r.id !== id) })),

      markLocationAsked: () => set({ locationAsked: true }),

      recordFeedback: (entry) =>
        set((s) => ({
          feedback: [
            { ...entry, at: Date.now() },
            // one answer per route per day; a change of mind replaces it
            ...s.feedback.filter((f) => !(f.date === entry.date && f.routeId === entry.routeId)),
          ].slice(0, 400),
        })),
    }),
    { name: 'bike-or-not', version: 4 },
  ),
)
