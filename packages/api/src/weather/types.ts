export interface WindAtHeight {
  speedKmh: number;
  dirDeg: number;
}

export interface HourlyWeather {
  timeUtc: Date;
  windKmh: number;
  gustKmh: number;
  dirDeg: number;
  wind1000m: WindAtHeight;
  wind2000m: WindAtHeight;
  wind3000m: WindAtHeight;
  capeJkg: number;
  cloudBaseM: number;
  rainMm: number;
}

export interface WeatherSource {
  readonly model: string;
  fetchHourly(lat: number, lon: number, days: number): Promise<HourlyWeather[]>;
}
