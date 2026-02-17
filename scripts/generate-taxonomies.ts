#!/usr/bin/env npx tsx
/**
 * Generate taxonomy index pages for preachers and series
 * Scans _posts/ frontmatter and creates filtered listing pages
 * Works on vanilla GitHub Pages (no plugins needed)
 *
 * Usage: npx tsx scripts/generate-taxonomies.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, '_posts');
const PREACHERS_DIR = path.join(ROOT, 'sermons', 'preachers');
const SERIES_DIR = path.join(ROOT, 'sermons', 'series');

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

interface Frontmatter {
  pastor?: string;
  series?: string;
  [key: string]: string | undefined;
}

function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm: Frontmatter = {};
  match[1].split('\n').forEach(line => {
    const m = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
    if (m) fm[m[1]] = m[2].trim();
  });
  return fm;
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir: string): void {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .forEach(f => fs.unlinkSync(path.join(dir, f)));
}

// Scan all posts
const posts = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.md'))
  .map(f => parseFrontmatter(fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8')));

// Extract unique preachers and series with counts
const preachers = new Map<string, number>();
const series = new Map<string, number>();

for (const fm of posts) {
  if (fm.pastor) {
    preachers.set(fm.pastor, (preachers.get(fm.pastor) || 0) + 1);
  }
  if (fm.series) {
    series.set(fm.series, (series.get(fm.series) || 0) + 1);
  }
}

// Generate preacher pages
ensureDir(PREACHERS_DIR);
cleanDir(PREACHERS_DIR);

for (const [name, count] of preachers) {
  const slug = slugify(name);
  const displayName = name.replace(/^Pastor /, '');
  const page = `---
layout: preacher
title: "Sermons by ${displayName}"
description: "Listen to ${count} sermons by ${displayName} from Saints Church in Knoxville, TN. Expository preaching through books of the Bible."
preacher: "${name}"
permalink: /sermons/preachers/${slug}/
---
`;
  fs.writeFileSync(path.join(PREACHERS_DIR, `${slug}.md`), page);
  console.log(`  Preacher: ${name} (${count} sermons) → /sermons/preachers/${slug}/`);
}

// Generate series pages
ensureDir(SERIES_DIR);
cleanDir(SERIES_DIR);

for (const [name, count] of series) {
  const slug = slugify(name);
  const page = `---
layout: series
title: "${name} Sermon Series"
description: "Listen to ${count} sermons in the ${name} series from Saints Church in Knoxville, TN. Verse-by-verse expository preaching."
series: "${name}"
permalink: /sermons/series/${slug}/
---
`;
  fs.writeFileSync(path.join(SERIES_DIR, `${slug}.md`), page);
  console.log(`  Series: ${name} (${count} sermons) → /sermons/series/${slug}/`);
}

// Generate index pages
const preacherIndex = `---
layout: taxonomy-index
title: "Preachers"
description: "Browse sermons by preacher from Saints Church in Knoxville, TN."
taxonomy_type: preachers
permalink: /sermons/preachers/
---
`;
fs.writeFileSync(path.join(PREACHERS_DIR, 'index.md'), preacherIndex);
console.log('  Index: /sermons/preachers/');

const seriesIndex = `---
layout: taxonomy-index
title: "Sermon Series"
description: "Browse sermon series from Saints Church in Knoxville, TN. Verse-by-verse expository preaching through books of the Bible."
taxonomy_type: series
permalink: /sermons/series/
---
`;
fs.writeFileSync(path.join(SERIES_DIR, 'index.md'), seriesIndex);
console.log('  Index: /sermons/series/');

console.log(`\nGenerated ${preachers.size} preacher pages, ${series.size} series pages, and 2 index pages.`);
