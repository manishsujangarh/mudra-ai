const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// 1. Get the default Expo Metro config
const config = getDefaultConfig(__dirname);

// 2. Clear Metro's cache internally for NativeWind
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// 3. Export the wrapped config
module.exports = withNativeWind(config, { input: "./global.css" });