import type { CheckId, Rating, ScoreNote } from '@hawa/contracts';

export type RatingKey = Rating | 'none';
export type Scheme = 'light' | 'dark';

export interface RatingColors {
  solid: string;
  on: string;
  soft: string;
  ink: string;
}

export interface Colors {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  primary: string;
  onPrimary: string;
  skeleton: string;
  warnBg: string;
  warnFg: string;
  map1: string;
  map2: string;
  rating: Record<RatingKey, RatingColors>;
}

export const colors: Record<Scheme, Colors> = {
  light: {
    bg: '#F4F5F6',
    surface: '#FFFFFF',
    surface2: '#E8EBED',
    ink: '#0D1012',
    ink2: '#4A535B',
    ink3: '#69727A',
    line: '#D3D8DC',
    primary: '#12171B',
    onPrimary: '#FFFFFF',
    skeleton: '#DFE3E6',
    warnBg: '#12171B',
    warnFg: '#FFFFFF',
    map1: '#E4E8E5',
    map2: '#DADFDB',
    rating: {
      green: {
        solid: '#1E7B43',
        on: '#FFFFFF',
        soft: '#E2F1E7',
        ink: '#17633A',
      },
      yellow: {
        solid: '#F0C12E',
        on: '#1B1600',
        soft: '#FBF0CC',
        ink: '#6E5200',
      },
      red: { solid: '#C42B23', on: '#FFFFFF', soft: '#FADFDC', ink: '#A8231C' },
      none: {
        solid: '#E8EBED',
        on: '#4A535B',
        soft: '#F4F5F6',
        ink: '#4A535B',
      },
    },
  },
  dark: {
    bg: '#08090A',
    surface: '#121416',
    surface2: '#1C1F22',
    ink: '#F3F5F6',
    ink2: '#B0B8BF',
    ink3: '#8E979F',
    line: '#2B3034',
    primary: '#F3F5F6',
    onPrimary: '#08090A',
    skeleton: '#22262A',
    warnBg: '#F3F5F6',
    warnFg: '#08090A',
    map1: '#121614',
    map2: '#181D1A',
    rating: {
      green: {
        solid: '#46C277',
        on: '#04120A',
        soft: '#10261A',
        ink: '#6FD898',
      },
      yellow: {
        solid: '#F2C94C',
        on: '#1B1600',
        soft: '#2B2410',
        ink: '#F2C94C',
      },
      red: { solid: '#FF6E61', on: '#1A0503', soft: '#341613', ink: '#FF8C81' },
      none: {
        solid: '#1C1F22',
        on: '#B0B8BF',
        soft: '#121416',
        ink: '#B0B8BF',
      },
    },
  },
};

// Color is never the only signal: always render glyph + label.
export const ratingMeta: Record<RatingKey, { glyph: string; label: string }> = {
  green: { glyph: '✓', label: 'Flyable' },
  yellow: { glyph: '!', label: 'Marginal' },
  red: { glyph: '✕', label: 'Not flyable' },
  none: { glyph: '–', label: 'Not saved' },
};

export const reasonText: Record<CheckId | ScoreNote, string> = {
  'launch-wind': 'Wind too strong at launch',
  'gust-spread': 'Gusts too strong',
  'wind-direction': 'Wind from the wrong direction',
  'wind-2000m': 'Strong wind at 2000 m',
  rain: 'Rain',
  'storm-risk': 'Storm risk',
  'light-wind': 'Light wind — forward launch may be harder',
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  tap: 48,
} as const;
export const radius = { sm: 6, md: 10, lg: 14, pill: 16 } as const;

export const fonts = { text: 'Archivo', mono: 'IBM Plex Mono' } as const;

export const type = {
  display: {
    fontFamily: fonts.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  title: { fontFamily: fonts.text, fontSize: 20, fontWeight: '700' },
  rowTitle: { fontFamily: fonts.text, fontSize: 17, fontWeight: '700' },
  body: { fontFamily: fonts.text, fontSize: 16, fontWeight: '400' },
  caption: { fontFamily: fonts.text, fontSize: 13, fontWeight: '500' },
  data: { fontFamily: fonts.mono, fontSize: 16, fontWeight: '600' },
  overline: {
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
} as const;

export const SAFETY_NOTE =
  'The score is a guide only. You are responsible for the decision to fly.';
