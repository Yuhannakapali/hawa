import { ApiError } from '../api/client';

const NOT_FOUND = 404;

export type LoadErrorKind = 'not-found' | 'not-saved-offline' | 'server';

export function classifyLoadError(error: Error, isFavorite: boolean): LoadErrorKind {
  if (error instanceof ApiError) {
    if (error.status === NOT_FOUND) {
      return 'not-found';
    }
    return 'server';
  }
  if (!isFavorite) {
    return 'not-saved-offline';
  }
  return 'server';
}
