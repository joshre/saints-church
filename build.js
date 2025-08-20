#!/usr/bin/env node
const { build } = require("estrella")
build({
  entry: "js/site.js",
  outfile: "js/site.min.js",
  bundle: true,
})