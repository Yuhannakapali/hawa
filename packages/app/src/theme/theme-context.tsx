import type { Rating } from '@hawa/contracts';
import { useColorScheme } from 'react-native';
import { useAppState } from '../state/app-state';
import { colors, ratingMeta, type Colors, type RatingKey, type Scheme } from './tokens';

export interface Chip {
  bg: string;
  fg: string;
  soft: string;
  ink: string;
  glyph: string;
  label: string;
}

export interface Theme {
  scheme: Scheme;
  c: Colors;
  chip: (rating: Rating | null | undefined) => Chip;
}

function ratingKey(rating: Rating | null | undefined): RatingKey {
  if (rating === null || rating === undefined) {
    return 'none';
  }
  return rating;
}

export function useTheme(): Theme {
  const system = useColorScheme();
  const { settings } = useAppState();
  let scheme: Scheme = 'light';
  if (settings.themePref === 'dark' || (settings.themePref === 'system' && system === 'dark')) {
    scheme = 'dark';
  }
  const c = colors[scheme];
  return {
    scheme,
    c,
    chip: (rating) => {
      const key = ratingKey(rating);
      const rc = c.rating[key];
      return {
        bg: rc.solid,
        fg: rc.on,
        soft: rc.soft,
        ink: rc.ink,
        ...ratingMeta[key],
      };
    },
  };
}
