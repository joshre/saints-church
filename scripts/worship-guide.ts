#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';

const ROOT = path.join(import.meta.dirname, '..');
const SONGS_DIR = path.join(ROOT, '_data', 'songs');
const GUIDES_DIR = path.join(ROOT, '_worship_guides');

interface PlanSong {
  title: string;
  author: string | null;
  copyright: string | null;
  ccli_number: number | null;
  lyrics: string | null;
}

interface PlanItem {
  sequence: number;
  kind: 'header' | 'catechism' | 'creed' | 'song' | 'prayer' | 'communion' | 'sermon' | 'other';
  title: string;
  description: string | null;
  catechism_number?: number;
  prayer_ref?: string | null;
  sermon_text?: string | null;
  song?: PlanSong;
}

interface Plan {
  date: string;
  plan_id: string;
  items: PlanItem[];
}

interface Stanza {
  number?: number;
  refrain?: boolean;
  lines: string[];
}

interface SongFile {
  title: string;
  writers?: string;
  copyright?: string;
  ccli?: number;
  stanzas: { number?: number; refrain?: boolean; lines: string }[];
}

type GuideItem =
  | { song: string }
  | { catechism: number }
  | { creed: string }
  | { prayer: string }
  | { communion: string }
  | { sermon: string }
  | { custom: { title: string; meta?: string } }
  | { include: string; title?: string };

interface GuideSection {
  name: string;
  catechism_answer?: 'kids';
  items: GuideItem[];
}

interface Guide {
  sunday: string | Date;
  sections: GuideSection[];
}

function loadYaml<T>(file: string): T {
  return yaml.load(fs.readFileSync(file, 'utf8')) as T;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function withoutParenthetical(title: string): string {
  return title.replace(/\s*\([^)]*\)\s*$/, '');
}

function slugify(title: string): string {
  return withoutParenthetical(title)
    .toLowerCase()
    .replace(/[’',]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function scalar(value: string): string {
  const plain = /^[A-Za-z0-9][^\n]*$/.test(value) && !/: |\s#|[:\s]$/.test(value);
  return plain && !/^(true|false|yes|no|null|~)$/i.test(value) ? value : JSON.stringify(value);
}

const LABEL =
  /^(verse|chorus|refrain|bridge|pre-?chorus|tag|intro|outro|ending|interlude|vamp|turnaround|instrumental|breakdown|hook|coda|misc)\b\s*(\d+)?\s*(\(?x\d+\)?)?\s*:?\s*$/i;

function parseLyrics(text: string): Stanza[] {
  const stanzas: Stanza[] = [];
  let current: Stanza | null = null;
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    const label = line.match(LABEL);
    if (label) {
      if (current?.lines.length > 0) stanzas.push(current);
      const kind = label[1].toLowerCase();
      current = { lines: [] };
      if (kind === 'verse' && label[2]) current.number = Number(label[2]);
      if (kind === 'chorus' || kind === 'refrain') current.refrain = true;
    } else if (line === '') {
      if (current?.lines.length > 0) {
        stanzas.push(current);
        current = null;
      }
    } else {
      current ??= { lines: [] };
      current.lines.push(line);
    }
  }
  if (current?.lines.length > 0) stanzas.push(current);
  return stanzas;
}

function writerList(author: string): string {
  return author
    .split(/,\s*(?:and\s+)?|\s+and\s+/)
    .map((name) => name.trim())
    .filter(Boolean)
    .join(', ');
}

// the guide prints no copyright line; PCO's strings are licensing boilerplate
function songYaml(song: PlanSong, stanzas: Stanza[]): string {
  const out = ['---', `title: ${JSON.stringify(song.title)}`];
  if (song.author) out.push(`writers: ${JSON.stringify(writerList(song.author))}`);
  if (song.ccli_number) out.push(`ccli: ${song.ccli_number}`);
  out.push('stanzas:');
  for (const stanza of stanzas) {
    const fields: string[] = [];
    if (stanza.refrain) fields.push('refrain: true');
    if (stanza.number) fields.push(`number: ${stanza.number}`);
    fields.push('lines: |');
    fields.forEach((field, i) => {
      out.push(`${i === 0 ? '  - ' : '    '}${field}`);
    });
    for (const line of stanza.lines) out.push(line ? `      ${line}` : '');
  }
  return `${out.join('\n')}\n`;
}

function loadSongs(): Map<string, SongFile> {
  const songs = new Map<string, SongFile>();
  for (const file of fs.readdirSync(SONGS_DIR).filter((f) => f.endsWith('.yml'))) {
    songs.set(path.basename(file, '.yml'), loadYaml<SongFile>(path.join(SONGS_DIR, file)));
  }
  return songs;
}

function findSong(songs: Map<string, SongFile>, song: PlanSong): string | undefined {
  for (const [slug, file] of songs) {
    if (song.ccli_number && file.ccli === song.ccli_number) return slug;
  }
  const keys = [normalize(song.title), normalize(withoutParenthetical(song.title))];
  for (const [slug, file] of songs) {
    if (song.ccli_number && file.ccli && file.ccli !== song.ccli_number) continue;
    if (
      keys.includes(normalize(file.title)) ||
      keys.includes(normalize(withoutParenthetical(file.title)))
    )
      return slug;
  }
  return undefined;
}

function longDate(date: string, weekday = false): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    ...(weekday ? { weekday: 'long' } : {}),
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

interface CatechismEntry {
  number: number;
  question: string;
  answer: string;
  kids_answer: string;
}

let catechismCache: CatechismEntry[] | undefined;
function loadCatechism(): CatechismEntry[] {
  catechismCache ??= loadYaml<CatechismEntry[]>(path.join(ROOT, '_data', 'catechism.yml'));
  return catechismCache;
}

let creedsCache: Record<string, { title: string; text: string }> | undefined;
function loadCreeds(): Record<string, { title: string; text: string }> {
  creedsCache ??= loadYaml(path.join(ROOT, '_data', 'creeds.yml'));
  return creedsCache;
}

function guideItemYaml(item: GuideItem): string[] {
  if ('custom' in item) {
    const lines = ['      - custom:', `          title: ${JSON.stringify(item.custom.title)}`];
    if (item.custom.meta) lines.push(`          meta: ${JSON.stringify(item.custom.meta)}`);
    return lines;
  }
  const [key, value] = Object.entries(item)[0];
  return [`      - ${key}: ${typeof value === 'number' ? value : scalar(value)}`];
}

function guideYaml(date: string, sections: GuideSection[]): string {
  const day = longDate(date);
  const out = [
    '---',
    `title: "Worship Guide, ${day}"`,
    `description: "The order of service, catechism, creed, songs and sermon text for Sunday, ${day} at Saints Church."`,
    `sunday: ${date}`,
    'sections:',
  ];
  for (const section of sections) {
    out.push(`  - name: ${scalar(section.name)}`);
    if (section.catechism_answer) out.push(`    catechism_answer: ${section.catechism_answer}`);
    out.push('    items:');
    for (const item of section.items) out.push(...guideItemYaml(item));
  }
  return `${out.join('\n')}\n---\n`;
}

function creedKey(title: string): string | undefined {
  const wanted = normalize(title);
  return Object.keys(loadCreeds()).find((key) => wanted.includes(key.replace(/s$/, '')));
}

function catechismWarning(item: PlanItem): string | undefined {
  const asked = item.description?.match(/^Q:\s*(.+)$/m)?.[1];
  if (!asked) return undefined;
  const entry = loadCatechism().find((q) => q.number === item.catechism_number);
  if (entry && normalize(entry.question) === normalize(asked)) return undefined;
  return `catechism ${item.catechism_number}: PCO asks "${asked}", _data/catechism.yml has "${entry?.question ?? 'no such question'}"`;
}

function required<T>(value: T | null | undefined, item: PlanItem, field: string): T {
  if (value === undefined || value === null) {
    throw new Error(`plan item ${item.sequence} (${item.title}) has no ${field}`);
  }
  return value;
}

function buildNew(planFile: string, lyricsDir: string | undefined, force: boolean): void {
  const plan = loadYaml<Plan>(planFile);
  const guideFile = path.join(GUIDES_DIR, `${plan.date}.md`);
  if (fs.existsSync(guideFile) && !force) {
    throw new Error(`${path.relative(ROOT, guideFile)} already exists; pass --force to replace it`);
  }

  const songs = loadSongs();
  const sections: GuideSection[] = [];
  const report: string[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];
  const blank: string[] = [];
  let section: GuideSection | null = null;
  let skipping = false;

  for (const item of plan.items) {
    if (item.kind === 'header') {
      skipping = /^intermission$/i.test(item.title);
      if (!skipping) {
        section = { name: item.title, items: [] };
        if (/family/i.test(item.title)) section.catechism_answer = 'kids';
        sections.push(section);
      }
      continue;
    }
    if (skipping) continue;
    if (!section) {
      section = { name: '', items: [] };
      sections.push(section);
    }

    switch (item.kind) {
      case 'catechism': {
        section.items.push({
          catechism: required(item.catechism_number, item, 'catechism_number'),
        });
        const warning = catechismWarning(item);
        if (warning) warnings.push(warning);
        break;
      }
      case 'creed': {
        const key = creedKey(item.title);
        section.items.push(key ? { creed: key } : { custom: { title: item.title } });
        if (!key)
          warnings.push(
            `creed "${item.title}" has no entry in _data/creeds.yml; written as a custom item`,
          );
        break;
      }
      case 'prayer':
        section.items.push({ prayer: item.prayer_ref ?? '' });
        if (!item.prayer_ref) blank.push('prayer (no psalm reference in PCO)');
        break;
      case 'communion':
        section.items.push({ communion: 'The Lord’s Supper' });
        break;
      case 'sermon':
        section.items.push({ sermon: item.sermon_text ?? '' });
        if (!item.sermon_text) blank.push('sermon (no passage in PCO)');
        break;
      case 'song': {
        const song = required(item.song, item, 'song');
        const existing = findSong(songs, song);
        if (existing) {
          section.items.push({ song: existing });
          report.push(`${existing}: existing`);
          break;
        }
        const base = slugify(song.title);
        const slug = songs.has(base) ? `${base}-${song.ccli_number ?? item.sequence}` : base;
        const fromDir = lyricsDir ? path.join(lyricsDir, `${slug}.txt`) : undefined;
        let source: string | undefined;
        let lyrics = song.lyrics;
        if (lyrics) source = 'PCO';
        else if (fromDir && fs.existsSync(fromDir)) {
          lyrics = fs.readFileSync(fromDir, 'utf8');
          source = `lyrics store (${path.basename(fromDir)})`;
        }
        section.items.push({ song: slug });
        const stanzas = lyrics ? parseLyrics(lyrics) : [];
        if (stanzas.length === 0) {
          missing.push(slug);
          report.push(`${slug}: MISSING lyrics for "${song.title}"`);
          break;
        }
        const file = path.join(SONGS_DIR, `${slug}.yml`);
        fs.writeFileSync(file, songYaml(song, stanzas));
        songs.set(slug, loadYaml<SongFile>(file));
        report.push(`${slug}: new from ${source} (${path.relative(ROOT, file)})`);
        break;
      }
      default:
        section.items.push({
          custom: item.description
            ? { title: item.title, meta: item.description }
            : { title: item.title },
        });
        warnings.push(`"${item.title}" is not a guide item type; written as a custom item`);
    }
  }

  fs.writeFileSync(guideFile, guideYaml(plan.date, sections));
  console.log(`Wrote ${path.relative(ROOT, guideFile)} from PCO plan ${plan.plan_id}`);
  for (const line of report) console.log(`  song ${line}`);
  for (const line of warnings) console.log(`  warning: ${line}`);
  if (missing.length > 0) console.log(`Missing lyrics: ${missing.join(', ')}`);
  if (blank.length > 0) console.log(`Left blank: ${blank.join(', ')}`);
  if (missing.length > 0 || blank.length > 0) process.exitCode = 2;
}

function printData(date: string): void {
  const source = fs.readFileSync(path.join(GUIDES_DIR, `${date}.md`), 'utf8');
  const guide = yaml.load(source.split(/^---$/m)[1]) as Guide;
  const songs = loadSongs();
  const catechism = loadCatechism();
  const creeds = loadCreeds();
  const content = loadYaml<{ worship_guide: { resources_list: string } }>(
    path.join(ROOT, '_data', 'content.yml'),
  );
  const config = loadYaml<{ url: string }>(path.join(ROOT, '_config.yml'));

  const missing: string[] = [];
  const parts = guide.sections.map((section) => ({
    name: '',
    items: section.items.flatMap((item) => {
      if ('song' in item) {
        const song = songs.get(item.song);
        if (!song?.stanzas || song.stanzas.length === 0) {
          missing.push(item.song);
          return [];
        }
        return [
          {
            type: 'song',
            title: song.title,
            writers: song.writers ?? null,
            copyright: song.copyright ?? null,
            stanzas: song.stanzas.map((stanza) => ({
              ...(stanza.number ? { n: stanza.number } : {}),
              ...(stanza.refrain ? { refrain: true } : {}),
              lines: stanza.lines.trim().split('\n'),
            })),
          },
        ];
      }
      if ('catechism' in item) {
        const q = catechism.find((entry) => entry.number === item.catechism);
        if (!q) throw new Error(`no catechism question ${item.catechism}`);
        const answer = section.catechism_answer === 'kids' ? q.kids_answer : q.answer;
        return [{ type: 'catechism', number: String(q.number), q: q.question, a: answer }];
      }
      if ('creed' in item) {
        const creed = creeds[item.creed];
        return [{ type: 'creed', title: creed.title, text: creed.text.trim() }];
      }
      if ('prayer' in item)
        return [{ type: 'prayer', ref: item.prayer.replace(/^psalms?\s+/i, '') }];
      if ('communion' in item) return [{ type: 'communion', title: item.communion }];
      if ('sermon' in item) return [{ type: 'sermon', text: item.sermon }];
      const label = 'custom' in item ? item.custom.title : (item.title ?? item.include);
      console.error(`warning: the print guide has no item for "${label}"; left it out`);
      return [];
    }),
  }));

  if (missing.length > 0) throw new Error(`no lyrics on file for: ${missing.join(', ')}`);

  const data = {
    dateLabel: longDate(date, true),
    resourcesUrl: `${config.url.replace(/^https?:\/\//, '')}/resources`,
    resourcesList: content.worship_guide.resources_list.split(' · '),
    parts,
    sermonNotes: 'attached',
  };
  console.log(JSON.stringify(data, null, 1));
}

const [command, target, ...rest] = process.argv.slice(2);
const flag = (name: string) => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
};

try {
  if (command === 'new' && target) buildNew(target, flag('--lyrics-dir'), rest.includes('--force'));
  else if (command === 'print' && target) printData(target);
  else {
    console.error(
      'usage: worship-guide.ts new <plan.json> [--lyrics-dir DIR] [--force] | print <YYYY-MM-DD>',
    );
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
