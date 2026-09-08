import { z } from 'zod'

/* Open-Meteo returns nulls inside otherwise-numeric series when a variable is
   unavailable for a model or hour, so every array tolerates them. */
const nums = z.array(z.number().nullable())

export const ForecastSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  elevation: z.number().optional(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number().nullable(),
    apparent_temperature: z.number().nullable(),
    is_day: z.number().nullable(),
    weather_code: z.number().nullable(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: nums,
    apparent_temperature: nums,
    relative_humidity_2m: nums,
    precipitation_probability: nums,
    precipitation: nums,
    snowfall: nums,
    weather_code: nums,
    cloud_cover: nums,
    visibility: nums.optional(),
    wind_speed_10m: nums,
    wind_direction_10m: nums,
    wind_gusts_10m: nums,
    uv_index: nums,
    is_day: nums,
  }),
  minutely_15: z.object({
    time: z.array(z.string()),
    precipitation: nums,
    precipitation_probability: nums,
    weather_code: nums,
  }).optional(),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: nums,
    temperature_2m_max: nums,
    temperature_2m_min: nums,
    precipitation_sum: nums,
    precipitation_probability_max: nums,
    wind_speed_10m_max: nums,
    wind_gusts_10m_max: nums,
    wind_direction_10m_dominant: nums,
    sunrise: z.array(z.string()),
    sunset: z.array(z.string()),
    uv_index_max: nums,
  }),
})

export const AirQualitySchema = z.object({
  hourly: z.object({
    time: z.array(z.string()),
    pm2_5: nums,
    european_aqi: nums.optional(),
    us_aqi: nums.optional(),
  }),
})

export const GeocodeSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        admin1: z.string().optional(),
        country: z.string().optional(),
        country_code: z.string().optional(),
      }),
    )
    .optional(),
})

export const ElevationSchema = z.object({ elevation: z.array(z.number()) })

export type Forecast = z.infer<typeof ForecastSchema>
export type AirQuality = z.infer<typeof AirQualitySchema>

/* The multi-model endpoint names its series `<variable>_<model>`, so the shape
   depends on which models were asked for. Validate loosely and index by name. */
const Series = z.array(z.number().nullable())

export const ConsensusSchema = z.object({
  hourly: z.record(z.string(), z.union([z.array(z.string()), Series])),
})
