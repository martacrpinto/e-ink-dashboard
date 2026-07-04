import { unstable_cache } from "next/cache";
import type { SourceResult, WeatherData } from "./types";

const WEATHER_LABELS: Array<[codes: number[], label: string, glyph: string]> = [
  [[0], "Céu limpo", "☀"],
  [[1, 2], "Parcialmente nublado", "⛅"],
  [[3], "Nublado", "☁"],
  [[45, 48], "Nevoeiro", "≡"],
  [[51, 53, 55, 56, 57], "Chuvisco", "☂"],
  [[61, 63, 65, 66, 67, 80, 81, 82], "Chuva", "☔"],
  [[71, 73, 75, 77, 85, 86], "Neve", "❄"],
  [[95, 96, 99], "Trovoada", "⚡"],
];

function describe(code: number): { label: string; glyph: string } {
  for (const [codes, label, glyph] of WEATHER_LABELS) {
    if (codes.includes(code)) return { label, glyph };
  }
  return { label: "—", glyph: "·" };
}

const fetchWeather = unstable_cache(
  async (lat: string, lon: string): Promise<WeatherData> => {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&timezone=auto&forecast_days=1`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Open-Meteo respondeu ${res.status}`);
    const json = await res.json();
    const code = json.current?.weather_code ?? 0;
    return {
      temperature: Math.round(json.current?.temperature_2m ?? 0),
      tempMin: Math.round(json.daily?.temperature_2m_min?.[0] ?? 0),
      tempMax: Math.round(json.daily?.temperature_2m_max?.[0] ?? 0),
      precipitationChance: json.daily?.precipitation_probability_max?.[0] ?? 0,
      code,
      ...describe(code),
    };
  },
  ["weather"],
  { revalidate: 1800, tags: ["weather"] },
);

export async function getWeather(): Promise<SourceResult<WeatherData>> {
  const lat = process.env.WEATHER_LAT;
  const lon = process.env.WEATHER_LON;
  if (!lat || !lon) return { status: "unconfigured", hint: "Define WEATHER_LAT e WEATHER_LON" };
  try {
    return { status: "ok", data: await fetchWeather(lat, lon) };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e) };
  }
}
