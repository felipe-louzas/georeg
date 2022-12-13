const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = function override(config) {
  config.plugins = (config.plugins || []).concat([
    new NodePolyfillPlugin({
      excludeAliases: ["console"],
    }),
  ]);

  config.ignoreWarnings = (config.ignoreWarnings || []).concat([
    /Failed to parse source map/,
  ]);

  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    fs: false,
    net: false,
    child_process: false,
    readline: false,
  });

  return config;
};
