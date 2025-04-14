const webpack = require("webpack");

module.exports = function override(config) {
  // Add polyfills for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    buffer: require.resolve("buffer/"),
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    util: require.resolve("util/"),
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    url: require.resolve("url/"),
    querystring: require.resolve("querystring-es3"),
    path: require.resolve("path-browserify"),
    process: false, // Do not use polyfill path, use provide plugin instead
    zlib: require.resolve("browserify-zlib"),
    fs: false,
    net: false,
    tls: false,
  };

  // Add plugins for polyfills
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: "process/browser.js", // Specify exact path with extension
      Buffer: ["buffer", "Buffer"],
    })
  );

  // Fix webpack 5 ESM issues with axios/canvg
  config.module = {
    ...config.module,
    rules: [
      ...config.module.rules,
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  };

  return config;
};
