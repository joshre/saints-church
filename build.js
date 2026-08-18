#!/usr/bin/env node
'use strict';
const { build } = require('estrella');

const isDev = process.argv.includes('--watch');

build({
  entry: 'js/site.ts',
  outfile: 'js/site.min.js',
  bundle: true,
  minify: !isDev,
  sourcemap: isDev,
});
