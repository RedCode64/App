const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Firebase JS SDK ships package.json "exports" that Metro resolves to the
// wrong (browser) build on React Native; disabling package exports makes Metro
// fall back to the "react-native"/"main" fields, which remains the supported
// workaround for firebase on Expo/Metro's default-enabled exports resolution.
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts.push('cjs');

module.exports = config;
