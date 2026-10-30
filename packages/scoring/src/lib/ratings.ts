import type { Rating } from './types.js';

const SEVERITY: Record<Rating, number> = { green: 0, yellow: 1, red: 2 };

export function isWorse(a: Rating, b: Rating): boolean {
  return SEVERITY[a] > SEVERITY[b];
}

export function worstOf(ratings: readonly Rating[]): Rating {
  return ratings.reduce<Rating>((worst, r) => {
    if (isWorse(r, worst)) {
      return r;
    }
    return worst;
  }, 'green');
}

export interface Band {
  greenMax: number;
  yellowMax: number;
  greenMaxInclusive: boolean;
}

export function rateInBand(value: number, band: Band): Rating {
  let isGreen = value < band.greenMax;
  if (band.greenMaxInclusive) {
    isGreen = value <= band.greenMax;
  }
  if (isGreen) {
    return 'green';
  }
  if (value <= band.yellowMax) {
    return 'yellow';
  }
  return 'red';
}
