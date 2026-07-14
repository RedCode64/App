module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 moved its Babel plugin into the separate worklets package.
    plugins: ['react-native-worklets/plugin'],
  };
};
