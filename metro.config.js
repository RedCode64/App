const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Firebase JS SDK ships package.json "exports" that Metro resolves to the
// wrong (browser) build on React Native; disabling package exports makes Metro
// fall back to the "react-native"/"main" fields, which is the supported setup
// for firebase@11 on Expo SDK 53.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
