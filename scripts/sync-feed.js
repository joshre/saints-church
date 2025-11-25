#!/usr/bin/env node
/**
 * Sync podcast RSS feed to Jekyll posts
 * Creates sermon posts for any episodes not yet tracked
 */

const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const parser = new Parser({
  customFields: {
    item: ['guid', 'enclosure', 'itunes:duration', 'itunes:author', 'itunes:summary']
  }
});

const RSS_URL = 'https://anchor.fm/s/f5d78a70/podcast/rss';
const POSTS_DIR = path.join(__dirname, '..', '_posts');
const PROCESSED_FILE = path.join(__dirname, '..', '_data', 'processed_episodes.json');

function getSermonSunday(date) {
  const day = new Date(date);
  const dayOfWeek = day.getDay();
  const sermonDate = new Date(day);
  sermonDate.setDate(day.getDate() - dayOfWeek);
  return sermonDate;
}

function generateFilename(date, title) {
  const dateStr = date.toISOString().split('T')[0];
  let slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
  if (!slug) slug = 'untitled-sermon';
  return `${dateStr}-${slug}.md`;
}

function extractScripture(text) {
  if (!text) return null;
  const pattern = /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\s*Samuel|2\s*Samuel|1\s*Kings|2\s*Kings|1\s*Chronicles|2\s*Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song\s+of\s+Songs|Song\s+of\s+Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\s*Corinthians|2\s*Corinthians|Galatians|Ephesians|Philippians|Colossians|1\s*Thessalonians|2\s*Thessalonians|1\s*Timothy|2\s*Timothy|Titus|Philemon|Hebrews|James|1\s*Peter|2\s*Peter|1\s*John|2\s*John|3\s*John|Jude|Revelation)\s+\d+(?::\d+(?:[-–]\d+)?)?(?:[-–]\d+:\d+)?\b/i;
  const match = pattern.exec(text);
  return match ? match[0].trim() : null;
}

function parseDuration(duration) {
  if (!duration) return null;
  const parts = duration.split(':').map(p => parseInt(p, 10));
  if (parts.some(p => isNaN(p))) return null;
  if (parts.length === 2) return `${parts[0]}:${parts[1].toString().padStart(2, '0')}`;
  if (parts.length === 3) {
    if (parts[0] > 0) return `${parts[0]}:${parts[1].toString().padStart(2, '0')}:${parts[2].toString().padStart(2, '0')}`;
    return `${parts[1]}:${parts[2].toString().padStart(2, '0')}`;
  }
  return duration;
}

function cleanDescription(text) {
  if (!text) return '';
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/<p>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/•/g, '-')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeYaml(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

async function sync() {
  console.log('Fetching RSS feed...');
  const feed = await parser.parseURL(RSS_URL);
  console.log(`Found ${feed.items.length} episodes in feed`);

  // Load processed episodes
  let processed = [];
  try {
    if (fs.existsSync(PROCESSED_FILE)) {
      processed = JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('Starting fresh processed episodes list');
  }

  const processedGuids = new Set(processed.map(p => p.guid));
  const existingFiles = new Set(fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')));

  let newCount = 0;
  let skippedExisting = 0;

  for (const item of feed.items) {
    const guid = item.guid || item.link;

    // Skip if already processed
    if (processedGuids.has(guid)) continue;

    const pubDate = new Date(item.pubDate);
    const sermonDate = getSermonSunday(pubDate);
    const filename = generateFilename(sermonDate, item.title);

    // If file exists but not tracked, just add to tracking
    if (existingFiles.has(filename)) {
      processed.push({ guid, title: item.title, filename, processed_at: new Date().toISOString() });
      skippedExisting++;
      continue;
    }

    // Extract metadata
    const scripture = extractScripture(item.title) || extractScripture(item.description);
    const duration = parseDuration(item['itunes:duration']);
    const episodeHash = crypto.createHash('sha256').update(guid).digest('hex').substring(0, 8);

    // Detect series from scripture
    let series = null;
    if (scripture) {
      const bookMatch = scripture.match(/^(.*?)\s+\d+/);
      if (bookMatch) {
        const book = bookMatch[1].trim();
        if (['John', 'Galatians', 'Romans', 'Acts', 'Genesis', 'Matthew', 'Mark', 'Luke', 'Ephesians', 'Philippians'].includes(book)) {
          series = book;
        }
      }
    }

    const desc = cleanDescription(item.description || item['itunes:summary'] || '');

    // Build frontmatter
    let content = '---\n';
    content += 'layout: sermon\n';
    content += `title: "${escapeYaml(item.title)}"\n`;
    content += `date: ${sermonDate.toISOString()}\n`;
    content += 'category: sermon\n';
    if (item.enclosure && item.enclosure.url) content += `audio_url: ${item.enclosure.url}\n`;
    if (duration) content += `duration: ${duration}\n`;
    if (scripture) content += `scripture: ${scripture}\n`;
    if (series) content += `series: ${series}\n`;
    content += 'pastor: Pastor Nate Ellis\n';
    if (desc) content += `description: "${escapeYaml(desc)}"\n`;
    content += `guid: ${guid}\n`;
    content += `episode_id: ${episodeHash}\n`;
    content += '---\n\n';

    fs.writeFileSync(path.join(POSTS_DIR, filename), content);
    console.log(`Created: ${filename}`);
    newCount++;

    processed.push({ guid, title: item.title, filename, processed_at: new Date().toISOString() });
  }

  // Save processed list
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processed, null, 2));

  console.log(`\nSync complete:`);
  console.log(`  - ${newCount} new episodes created`);
  console.log(`  - ${skippedExisting} existing files added to tracking`);
  console.log(`  - ${processed.length} total episodes tracked`);
}

sync().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
