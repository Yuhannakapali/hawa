export * from 'react-native-web';

// Native libraries (react-native-svg) look up TurboModuleRegistry at import time; the web has no native modules.
export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => null,
};
