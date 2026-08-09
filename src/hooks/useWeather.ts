import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export type WeatherSnapshot = {
  temperatureC: number;
  temperatureF: number;
  weatherCode: number;
  windSpeedKmh: number;
  isDay: boolean;
  latitude: number;
  longitude: number;
};

type GeoCoords = { latitude: number; longitude: number };

const FALLBACK_COORDS: GeoCoords = {
  // Grand Rapids, MI — sensible Midwest default when geolocation is denied
  latitude: 42.9634,
  longitude: -85.6681,
};

const WMO_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Icy fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

export function weatherLabel(code: number): string {
  return WMO_LABELS[code] ?? "Weather";
}

function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

async function resolveCoords(): Promise<GeoCoords> {
  if (!navigator.geolocation) return FALLBACK_COORDS;
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 30 * 60 * 1000,
      });
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return FALLBACK_COORDS;
  }
}

async function fetchWeather(): Promise<WeatherSnapshot> {
  const coords = await resolveCoords();
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(coords.latitude));
  url.searchParams.set("longitude", String(coords.longitude));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m,is_day");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const json = (await res.json()) as {
    current?: {
      temperature_2m?: number;
      weather_code?: number;
      wind_speed_10m?: number;
      is_day?: number;
    };
  };
  const current = json.current;
  if (
    current?.temperature_2m == null ||
    current.weather_code == null ||
    current.wind_speed_10m == null
  ) {
    throw new Error("Weather response was incomplete");
  }

  return {
    temperatureC: current.temperature_2m,
    temperatureF: cToF(current.temperature_2m),
    weatherCode: current.weather_code,
    windSpeedKmh: current.wind_speed_10m,
    isDay: current.is_day === 1,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

export function useWeather() {
  return useQuery({
    queryKey: ["open-meteo-weather"],
    queryFn: fetchWeather,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
  });
}

export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
