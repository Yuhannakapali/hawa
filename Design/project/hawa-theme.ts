// Hawa shared theme — mirrors the design canvas. Use with a ThemeProvider + useColorScheme().
export type Rating = 'green' | 'yellow' | 'red' | 'none';

const rating = {
  light: {
    green:  { solid: '#1E7B43', on: '#FFFFFF', soft: '#E2F1E7', ink: '#17633A' },
    yellow: { solid: '#F0C12E', on: '#1B1600', soft: '#FBF0CC', ink: '#6E5200' },
    red:    { solid: '#C42B23', on: '#FFFFFF', soft: '#FADFDC', ink: '#A8231C' },
    none:   { solid: '#E8EBED', on: '#4A535B', soft: '#F4F5F6', ink: '#4A535B' },
  },
  dark: {
    green:  { solid: '#46C277', on: '#04120A', soft: '#10261A', ink: '#6FD898' },
    yellow: { solid: '#F2C94C', on: '#1B1600', soft: '#2B2410', ink: '#F2C94C' },
    red:    { solid: '#FF6E61', on: '#1A0503', soft: '#341613', ink: '#FF8C81' },
    none:   { solid: '#1C1F22', on: '#B0B8BF', soft: '#121416', ink: '#B0B8BF' },
  },
} as const;

export const colors = {
  light: { bg: '#F4F5F6', surface: '#FFFFFF', surface2: '#E8EBED', ink: '#0D1012', ink2: '#4A535B', ink3: '#69727A', line: '#D3D8DC', primary: '#12171B', onPrimary: '#FFFFFF', skeleton: '#DFE3E6', warnBg: '#12171B', warnFg: '#FFFFFF', rating: rating.light },
  dark:  { bg: '#08090A', surface: '#121416', surface2: '#1C1F22', ink: '#F3F5F6', ink2: '#B0B8BF', ink3: '#8E979F', line: '#2B3034', primary: '#F3F5F6', onPrimary: '#08090A', skeleton: '#22262A', warnBg: '#F3F5F6', warnFg: '#08090A', rating: rating.dark },
};

// Color is never the only signal: always render glyph + label.
export const ratingMeta: Record<Rating, { glyph: string; label: string }> = {
  green: { glyph: '✓', label: 'Flyable' },
  yellow: { glyph: '!', label: 'Marginal' },
  red: { glyph: '✕', label: 'Not flyable' },
  none: { glyph: '–', label: 'Not saved' },
};

export const reasonText = {
  'launch-wind': 'Wind too strong at launch',
  'gust-spread': 'Gusts too strong',
  'wind-direction': 'Wind from the wrong direction',
  'wind-2000m': 'Strong wind at 2000 m',
  rain: 'Rain',
  'storm-risk': 'Storm risk',
  'light-wind': 'Light wind — forward launch may be harder',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, tap: 48 };
export const radius = { sm: 6, md: 10, lg: 14, pill: 16 };

export const fonts = { text: 'Archivo', mono: 'IBM Plex Mono' };
export const type = {
  display: { fontFamily: fonts.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.6 },
  title:   { fontFamily: fonts.text, fontSize: 20, fontWeight: '700' },
  rowTitle:{ fontFamily: fonts.text, fontSize: 17, fontWeight: '700' },
  body:    { fontFamily: fonts.text, fontSize: 16, fontWeight: '400' },
  caption: { fontFamily: fonts.text, fontSize: 13, fontWeight: '500' },
  data:    { fontFamily: fonts.mono, fontSize: 16, fontWeight: '600' },
  overline:{ fontFamily: fonts.mono, fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
} as const;

export const limits = { student: { altitudeWindKmh: 20 }, pilot: { altitudeWindKmh: 30 } };
