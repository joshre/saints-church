#!/usr/bin/env npx tsx
/**
 * Generate taxonomy index pages for speakers and series
 * Scans _posts/ frontmatter and creates filtered listing pages
 * Works on vanilla GitHub Pages (no plugins needed)
 *
 * Usage: npx tsx scripts/generate-taxonomies.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, '_posts');
const SPEAKERS_DIR = path.join(ROOT, 'sermons', 'speakers');
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

// Extract unique speakers and series with counts
const speakers = new Map<string, number>();
const series = new Map<string, number>();

for (const fm of posts) {
  if (fm.pastor) {
    speakers.set(fm.pastor, (speakers.get(fm.pastor) || 0) + 1);
  }
  if (fm.series) {
    series.set(fm.series, (series.get(fm.series) || 0) + 1);
  }
}

// Generate speaker pages
ensureDir(SPEAKERS_DIR);
cleanDir(SPEAKERS_DIR);

for (const [name, count] of speakers) {
  const slug = slugify(name);
  const displayName = name.replace(/^Pastor /, '');
  const page = `---
layout: speaker
title: "Sermons by ${displayName}"
description: "Listen to ${count} sermons by ${displayName} from Saints Church in Knoxville, TN. Expository preaching through books of the Bible."
speaker: "${name}"
permalink: /sermons/speakers/${slug}/
---
`;
  fs.writeFileSync(path.join(SPEAKERS_DIR, `${slug}.md`), page);
  console.log(`  Speaker: ${name} (${count} sermons) → /sermons/speakers/${slug}/`);
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
const speakerIndex = `---
layout: taxonomy-index
title: "Preachers"
description: "Browse sermons by preacher from Saints Church in Knoxville, TN."
taxonomy_type: speakers
permalink: /sermons/speakers/
---
`;
fs.writeFileSync(path.join(SPEAKERS_DIR, 'index.md'), speakerIndex);
console.log('  Index: /sermons/speakers/');

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

console.log(`\nGenerated ${speakers.size} speaker pages, ${series.size} series pages, and 2 index pages.`);
