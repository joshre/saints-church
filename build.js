#!/usr/bin/env node
const { build } = require("estrella")

const isDev = process.argv.includes('--watch')

build({
  entry: "js/site.js",
  outfile: "js/site.min.js",
  bundle: true,
  minify: !isDev,
  sourcemap: isDev
})