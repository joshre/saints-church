#!/usr/bin/env node
'use strict';
/**
 * Generate preacher avatar variants.
 *
 * For every preacher in _data/preachers.yml, emits from assets/images/<image>.jpg:
 *   - <image>-16w.jpg    the low-res base the <img> carries
 *   - <image>-64w.webp / -128w.webp / -256w.webp  (256w covers the 128px
 *     letter avatar on a 2x display)
 *
 * The <img> carries the 16w jpg and the <source> steps up to WebP. AVIF is
 * deliberately absent: its fixed container overhead makes it 5-50x larger than
 * WebP at these dimensions (measured 544-6031 bytes vs 90-138 at 16px).
 *
 * Requires ImageMagick (`magick`). Not part of the CI freshness gate -- the output
 * is committed like the other pre-sized image variants in assets/images/.
 *
 * Usage: yarn generate-avatars
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'assets', 'images');
const PREACHERS = path.join(ROOT, '_data', 'preachers.yml');
const WIDTHS = [64, 128, 256];
const LOWRES_WIDTH = 16;

function magick(src, dest, width, quality) {
  // -strip matters: two source photos carry ICC profiles that dwarf a 16px payload
  execFileSync('magick', [
    src,
    '-strip',
    '-resize',
    `${width}x${width}`,
    '-quality',
    String(quality),
    dest,
  ]);
}

function main() {
  try {
    execFileSync('magick', ['-version'], { stdio: 'ignore' });
  } catch {
    console.error('ImageMagick not found. Install it with: brew install imagemagick');
    process.exit(1);
  }

  const preachers = yaml.load(fs.readFileSync(PREACHERS, 'utf8'));

  for (const preacher of preachers) {
    const src = path.join(IMAGES_DIR, `${preacher.image}.jpg`);
    if (!fs.existsSync(src)) {
      console.error(`  missing source: ${src}`);
      process.exit(1);
    }

    for (const width of WIDTHS) {
      const dest = path.join(IMAGES_DIR, `${preacher.image}-${width}w.webp`);
      magick(src, dest, width, 82);
      console.log(`  ${preacher.image}-${width}w.webp -> ${fs.statSync(dest).size} bytes`);
    }

    const lowres = path.join(IMAGES_DIR, `${preacher.image}-${LOWRES_WIDTH}w.jpg`);
    magick(src, lowres, LOWRES_WIDTH, 40);
    console.log(`  ${preacher.image}-${LOWRES_WIDTH}w.jpg -> ${fs.statSync(lowres).size} bytes`);
  }

  console.log(`\nGenerated variants for ${preachers.length} preachers.`);
}

main();
