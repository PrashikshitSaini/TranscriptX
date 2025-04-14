// Custom process.js polyfill for browser environment
const process = {
  env: {},
  browser: true,
  version: "",
  nextTick: function (fn) {
    setTimeout(fn, 0);
  },
  title: "browser",
  argv: [],
  on: function () {},
  once: function () {},
  off: function () {},
  emit: function () {},
  binding: function () {
    throw new Error("process.binding is not supported");
  },
};

// Set default NODE_ENV if not set
process.env.NODE_ENV = process.env.NODE_ENV || "development";

module.exports = process;
