#!/usr/bin/env node
/**
 * Sync podcast RSS feed to Jekyll posts
 *
 * Creates sermon posts for any episodes not yet tracked. When an existing
 * post is found, preserves the body (including any transcription) and only
 * refreshes the frontmatter if it has drifted from the RSS feed.
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
const DEFAULT_PASTOR = 'Pastor Nate Ellis';
const SERIES_THRESHOLD = 3;

function getSermonSunday(date) {
  // UTC methods, not local (getDay/setDate): the scheduled workflow runs in UTC,
  // but a local run in any other timezone would otherwise derive a different
  // calendar day near midnight and create a duplicate post under a shifted filename.
  const day = new Date(date);
  const dayOfWeek = day.getUTCDay();
  const sermonDate = new Date(day);
  sermonDate.setUTCDate(day.getUTCDate() - dayOfWeek);
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
  // Verse range may span chapters: "John 11:45-12:8" or stay in one chapter: "Acts 1:1-11".
  const pattern =
    /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\s*Samuel|2\s*Samuel|1\s*Kings|2\s*Kings|1\s*Chronicles|2\s*Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song\s+of\s+Songs|Song\s+of\s+Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\s*Corinthians|2\s*Corinthians|Galatians|Ephesians|Philippians|Colossians|1\s*Thessalonians|2\s*Thessalonians|1\s*Timothy|2\s*Timothy|Titus|Philemon|Hebrews|James|1\s*Peter|2\s*Peter|1\s*John|2\s*John|3\s*John|Jude|Revelation)\s+\d+(?::\d+)?(?:\s*[-–]\s*\d+(?::\d+)?)?\b/i;
  const match = pattern.exec(text);
  return match ? match[0].replace(/\s+/g, ' ').trim() : null;
}

function parseDuration(duration) {
  if (!duration) return null;
  const str = String(duration).trim();
  if (str.includes(':')) {
    const parts = str.split(':').map(p => parseInt(p, 10));
    if (parts.some(p => isNaN(p))) return null;
    if (parts.length === 2) return `${parts[0]}:${parts[1].toString().padStart(2, '0')}`;
    if (parts.length === 3) {
      if (parts[0] > 0) return `${parts[0]}:${parts[1].toString().padStart(2, '0')}:${parts[2].toString().padStart(2, '0')}`;
      return `${parts[1]}:${parts[2].toString().padStart(2, '0')}`;
    }
    return str;
  }
  const seconds = Number(str);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
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

function detectPastor(text) {
  if (!text) return null;
  const match = text.match(/[Pp]reached by ([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)/);
  return match ? `Pastor ${match[1]}` : null;
}

function escapeYaml(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function splitFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  return { frontmatterText: match[1], body: match[2] };
}

function parseFrontmatter(text) {
  const result = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    result[m[1]] = value;
  }
  return result;
}

function yamlNeedsQuotes(value) {
  if (typeof value !== 'string') return false;
  if (value === '') return true;
  if (/^\s|\s$/.test(value)) return true;
  // YAML treats ": " as a key/value separator inside flow scalars; standalone colons are fine.
  if (/:\s|\s#/.test(value)) return true;
  // YAML 1.1 parses all-numeric colon-separated segments (e.g. "34:22") as sexagesimal,
  // which silently turns a MM:SS duration string into an integer.
  if (/^\d+(:\d+){1,2}$/.test(value)) return true;
  // Leading chars that have special meaning in YAML.
  if (/^[-?:,[\]{}#&*!|>'"%@`]/.test(value)) return true;
  // Pipe mid-value is technically legal as a plain scalar, but quoting it avoids
  // surprising readers (the workflow heredoc used to quote it).
  if (/[|\n"\\]/.test(value)) return true;
  return false;
}

function buildFrontmatter(fields) {
  let out = '---\n';
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined || value === '') continue;
    if (yamlNeedsQuotes(value)) {
      out += `${key}: "${escapeYaml(value)}"\n`;
    } else {
      out += `${key}: ${value}\n`;
    }
  }
  out += '---\n';
  return out;
}

// Compare field maps semantically (string equality on non-null fields only).
function fieldsEqual(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const av = a[key] == null ? '' : String(a[key]);
    const bv = b[key] == null ? '' : String(b[key]);
    if (av !== bv) return false;
  }
  return true;
}

function buildFields(item, bookCounts, existingFields = {}) {
  const pubDate = new Date(item.pubDate);
  const sermonDate = getSermonSunday(pubDate);
  const scripture = existingFields.scripture ||
    extractScripture(item.title) || extractScripture(item.description);
  const duration = parseDuration(item['itunes:duration']);
  const guid = item.guid || item.link;
  const episodeHash = crypto.createHash('sha256').update(guid).digest('hex').substring(0, 8);

  // Re-run on every sync (not gated behind --update) so a book crossing SERIES_THRESHOLD
  // backfills series onto posts created before the threshold was met.
  let series = existingFields.series || null;
  if (!series && scripture) {
    const bookMatch = scripture.match(/^(.*?)\s+\d+/);
    if (bookMatch) {
      const book = bookMatch[1].trim();
      if (bookCounts[book] >= SERIES_THRESHOLD) series = book;
    }
  }

  const detectedPastor =
    detectPastor(item.description) || detectPastor(item['itunes:summary']);
  const pastor = existingFields.pastor || detectedPastor || DEFAULT_PASTOR;

  const desc = existingFields.description ||
    cleanDescription(item.description || item['itunes:summary'] || '') || null;

  // date/title fall back to a hand-corrected existing value (e.g. a mis-dated RSS
  // pubDate) rather than always trusting the feed.
  const date = existingFields.date || sermonDate.toISOString();
  const title = existingFields.title || item.title;

  const fields = {
    layout: 'sermon',
    title,
    date,
    category: 'sermon',
    audio_url: item.enclosure && item.enclosure.url ? item.enclosure.url : null,
    duration,
    scripture,
    series,
    pastor,
    description: desc,
    guid,
    episode_id: episodeHash
  };

  // Preserve custom fields that aren't sourced from RSS (transcription_model, etc.)
  const preservedKeys = ['transcription_model'];
  for (const key of preservedKeys) {
    if (existingFields[key]) fields[key] = existingFields[key];
  }

  return fields;
}

async function sync({ updateExisting = false } = {}) {
  console.log('Fetching RSS feed...');
  if (updateExisting) console.log('Update mode: existing posts will be rewritten if frontmatter differs.');
  const feed = await parser.parseURL(RSS_URL);
  console.log(`Found ${feed.items.length} episodes in feed`);

  let processed = [];
  try {
    if (fs.existsSync(PROCESSED_FILE)) {
      processed = JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('Starting fresh processed episodes list');
  }

  const processedMap = new Map(processed.map(p => [p.guid, p]));
  const existingFiles = new Set(fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md')));

  const bookCounts = {};
  for (const item of feed.items) {
    const scripture = extractScripture(item.title) || extractScripture(item.description);
    if (scripture) {
      const bookMatch = scripture.match(/^(.*?)\s+\d+/);
      if (bookMatch) {
        const book = bookMatch[1].trim();
        bookCounts[book] = (bookCounts[book] || 0) + 1;
      }
    }
  }

  let newCount = 0;
  let updatedCount = 0;
  let trackedExisting = 0;

  for (const item of feed.items) {
    const guid = item.guid || item.link;
    if (!guid) {
      console.warn(`Skipping episode with no GUID: ${item.title}`);
      continue;
    }

    const pubDate = new Date(item.pubDate);
    if (isNaN(pubDate.getTime())) {
      console.warn(`Skipping episode with invalid pubDate: ${item.title}`);
      continue;
    }

    const sermonDate = getSermonSunday(pubDate);
    const filename = generateFilename(sermonDate, item.title);
    const filepath = path.join(POSTS_DIR, filename);
    const fileExists = existingFiles.has(filename);

    let existingFields = {};
    let existingBody = '';
    if (fileExists) {
      const existingContent = fs.readFileSync(filepath, 'utf8');
      const split = splitFrontmatter(existingContent);
      if (split) {
        existingFields = parseFrontmatter(split.frontmatterText);
        // splitFrontmatter's regex already consumes one \n after the closing ---,
        // so strip further leading blank lines to avoid growing them on rewrite.
        existingBody = split.body.replace(/^\n+/, '\n');
      }
    }

    const fields = buildFields(item, bookCounts, existingFields);
    const newFrontmatter = buildFrontmatter(fields);

    if (!fileExists) {
      fs.writeFileSync(filepath, `${newFrontmatter}\n`);
      console.log(`Created: ${filename}`);
      newCount++;
    } else if (updateExisting) {
      // Compare parsed fields, not serialized bytes: pre-existing files may have
      // cosmetic quoting that yamlNeedsQuotes wouldn't itself apply, and byte-diffing
      // would rewrite (and commit) every such post despite no real content change.
      if (!fieldsEqual(existingFields, fields)) {
        const newContent = `${newFrontmatter}\n${existingBody}`;
        fs.writeFileSync(filepath, newContent);
        console.log(`Updated frontmatter: ${filename}`);
        updatedCount++;
      } else if (!processedMap.has(guid)) {
        trackedExisting++;
      }
    } else if (!processedMap.has(guid)) {
      trackedExisting++;
    }

    processedMap.set(guid, {
      guid,
      title: item.title,
      filename,
      processed_at: new Date().toISOString()
    });
  }

  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(Array.from(processedMap.values()), null, 2));

  console.log(`\nSync complete:`);
  console.log(`  - ${newCount} new episodes created`);
  console.log(`  - ${updatedCount} existing episodes refreshed`);
  console.log(`  - ${trackedExisting} existing files added to tracking`);
  console.log(`  - ${processedMap.size} total episodes tracked`);
}

module.exports = {
  sync,
  parseDuration,
  extractScripture,
  detectPastor,
  buildFrontmatter,
  parseFrontmatter,
  splitFrontmatter,
  yamlNeedsQuotes
};

if (require.main === module) {
  const updateExisting = process.argv.includes('--update');
  sync({ updateExisting }).catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
}
