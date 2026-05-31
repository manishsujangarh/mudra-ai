module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
          },
        },
      ],
      // Reanimated 4 moved its Babel plugin into react-native-worklets.
      // Must be listed last.
      "react-native-worklets/plugin",
    ],
  };
};
