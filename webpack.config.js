const path = require("path");
const webpack = require("webpack");

module.exports = {
  resolve: {
    fallback: {
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      process: false,
    },
    alias: {
      "process/browser": path.resolve(
        __dirname,
        "./src/polyfills/process-browser.js"
      ),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: path.resolve(__dirname, "./src/polyfills/process-browser.js"),
      Buffer: ["buffer", "Buffer"],
    }),
  ],
};
