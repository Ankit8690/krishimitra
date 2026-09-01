import { cacheWrap } from "./cache";

export type DailyForecast = {
  date: string;
  tempMax: number;
  tempMin: number;
  rainProb: number;
  rainMm: number;
  windMax: number;
  weatherCode: number;
};

export type HourlyPoint = {
  time: string; // ISO
  temp: number;
  rainProb: number;
  rainMm: number;
};

export type WeatherReport = {
  location: { lat: number; lon: number; tz: string };
  current: {
    tempC: number;
    humidity: number;
    windKph: number;
    rainMm: number;
    weatherCode: number;
    time: string;
  };
  hourly: HourlyPoint[]; // next 24h
  daily: DailyForecast[]; // 7 days
  sprayAdvice: { ok: boolean; reason: string };
};

const BASE = process.env.OPEN_METEO_BASE || "https://api.open-meteo.com/v1";

// Rule engine: safe to spray if next 6 h rain prob < 40 % and wind < 20 km/h.
function computeSprayAdvice(h: HourlyPoint[]): { ok: boolean; reason: string } {
  const next6 = h.slice(0, 6);
  const maxRain = Math.max(0, ...next6.map((p) => p.rainProb));
  if (maxRain >= 40) {
    return { ok: false, reason: `Rain likely (${Math.round(maxRain)}%) in next 6 hours` };
  }
  return { ok: true, reason: "Low rain risk in next 6 hours" };
}

export async function getWeather(lat: number, lon: number): Promise<WeatherReport> {
  const key = `wx:${lat.toFixed(3)}:${lon.toFixed(3)}`;
  return cacheWrap(key, 60 * 30, async () => {
    const url = new URL(`${BASE}/forecast`);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("timezone", "auto");
    url.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code"
    );
    url.searchParams.set(
      "hourly",
      "temperature_2m,precipitation_probability,precipitation"
    );
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,weather_code"
    );
    url.searchParams.set("forecast_days", "7");
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
    const raw = (await res.json()) as {
      timezone: string;
      current: {
        time: string;
        temperature_2m: number;
        relative_humidity_2m: number;
        wind_speed_10m: number;
        precipitation: number;
        weather_code: number;
      };
      hourly: {
        time: string[];
        temperature_2m: number[];
        precipitation_probability: number[];
        precipitation: number[];
      };
      daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_probability_max: number[];
        precipitation_sum: number[];
        wind_speed_10m_max: number[];
        weather_code: number[];
      };
    };

    // Trim hourly to next 24 hours starting from current hour
    const nowIso = raw.current.time.slice(0, 13); // yyyy-mm-ddThh
    const startIdx = Math.max(
      0,
      raw.hourly.time.findIndex((t) => t.slice(0, 13) >= nowIso)
    );
    const hourly: HourlyPoint[] = raw.hourly.time
      .slice(startIdx, startIdx + 24)
      .map((t, i) => ({
        time: t,
        temp: raw.hourly.temperature_2m[startIdx + i],
        rainProb: raw.hourly.precipitation_probability[startIdx + i] ?? 0,
        rainMm: raw.hourly.precipitation[startIdx + i] ?? 0,
      }));

    const daily: DailyForecast[] = raw.daily.time.map((d, i) => ({
      date: d,
      tempMax: raw.daily.temperature_2m_max[i],
      tempMin: raw.daily.temperature_2m_min[i],
      rainProb: raw.daily.precipitation_probability_max[i] ?? 0,
      rainMm: raw.daily.precipitation_sum[i] ?? 0,
      windMax: raw.daily.wind_speed_10m_max[i] ?? 0,
      weatherCode: raw.daily.weather_code[i] ?? 0,
    }));

    return {
      location: { lat, lon, tz: raw.timezone },
      current: {
        tempC: raw.current.temperature_2m,
        humidity: raw.current.relative_humidity_2m,
        windKph: raw.current.wind_speed_10m,
        rainMm: raw.current.precipitation,
        weatherCode: raw.current.weather_code,
        time: raw.current.time,
      },
      hourly,
      daily,
      sprayAdvice: computeSprayAdvice(hourly),
    };
  });
}

// WMO weather code → short label
export function weatherLabel(code: number): string {
  if ([0].includes(code)) return "Clear";
  if ([1, 2].includes(code)) return "Mostly clear";
  if ([3].includes(code)) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55].includes(code)) return "Drizzle";
  if ([61, 63, 65].includes(code)) return "Rain";
  if ([66, 67].includes(code)) return "Freezing rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([95].includes(code)) return "Thunderstorm";
  if ([96, 99].includes(code)) return "Thunderstorm w/ hail";
  return "Unknown";
}

export function weatherEmoji(code: number): string {
  if ([0, 1].includes(code)) return "☀️";
  if ([2].includes(code)) return "⛅";
  if ([3].includes(code)) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([66, 67].includes(code)) return "🌧️";
  if ([71, 73, 75, 77].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}
