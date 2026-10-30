export type SpeedUnit = 'kmh' | 'kt';
export type AltitudeUnit = 'm' | 'ft';

const KMH_TO_KT = 0.539957;
const M_TO_FT = 3.28084;

export function speed(kmh: number, unit: SpeedUnit): number {
  if (unit === 'kt') {
    return Math.round(kmh * KMH_TO_KT);
  }
  return Math.round(kmh);
}

export function speedUnitLabel(unit: SpeedUnit): string {
  if (unit === 'kt') {
    return 'kt';
  }
  return 'km/h';
}

export function altitude(meters: number, unit: AltitudeUnit): string {
  if (unit === 'ft') {
    return `${Math.round(meters * M_TO_FT)} ft`;
  }
  return `${Math.round(meters)} m`;
}
