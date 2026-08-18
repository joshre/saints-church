# Saints Church GitHub Actions Workflows

This directory contains automated workflows for the Saints Church Jekyll website.

## Podcast Sync Workflow (`podcast-sync.yml`)

### Overview

Automatically syncs sermon episodes from the Saints Church RSS feed to Jekyll posts, optimized for Reformed Baptist expository preaching series.

The workflow is a thin wrapper – all the parsing and post-generation logic lives in `scripts/sync-feed.js`, which is also what you run locally via `node scripts/sync-feed.js`.

### Features

#### RSS Feed Processing

- Parses `https://anchor.fm/s/f5d78a70/podcast/rss`
- Extracts comprehensive episode metadata:
  - Title and description
  - Publication date
  - Audio URL and duration
  - Unique GUID for duplicate prevention
  - iTunes metadata (author, duration, etc.)

#### Jekyll Post Generation

Creates properly formatted posts in `_posts/` directory with frontmatter:

```yaml
---
layout: "sermon"
title: "John 21:1-14"
date: "2025-09-14T23:31:20.000Z"
category: "sermon"
audio_url: "https://anchor.fm/..."
duration: "26:48"
scripture: "John 21:1-14"
series: "John"
pastor: "Pastor Nate Ellis"
description: |
  Episode description with HTML formatting
guid: "unique-episode-identifier"
---
```

#### Reformed Baptist Context

- **Scripture References**: Detects full book names followed by a chapter and optional verse range — "John 21:1-14", "1 Corinthians 15:1-11", "Genesis 5". All 66 books are recognized, numbered books with or without a space ("1 Samuel", "1Samuel"). Abbreviations ("Jn"), Roman numerals ("I Corinthians"), and "v." verse notation are **not** matched; those titles land without a `scripture` field and need manual frontmatter.

- **Series Detection**: Assigns a series once a biblical book reaches `SERIES_THRESHOLD` (3) sermons, so a one-off sermon doesn't create a series of one. This is recalculated on every sync, not just with `--update`, so a book crossing the threshold retroactively picks up its earlier sermons

- **Pastor Attribution**: Resolves preacher names against `_data/preachers.yml`, falling back to the RSS feed author

#### Duplicate Prevention

- Tracks processed episodes in `_data/processed_episodes.json`
- Uses GUID-based duplicate detection
- Double-checks file existence for additional safety

### Schedule

**Primary Schedule**: Weekly on Sundays at 9:00 AM UTC (4:00 AM EST / 5:00 AM EDT)

- Timing allows for sermon uploads after Sunday morning service
- Accounts for timezone differences in Knoxville, TN

**Manual Trigger**: Available via GitHub Actions interface for immediate sync

### File Naming Convention

Posts are created with the format: `YYYY-MM-DD-slug.md`

Where:

- `YYYY-MM-DD` is the episode publication date
- `slug` is a URL-friendly version of the episode title
- Special characters are removed, spaces become hyphens

Examples:

- `2025-09-14-john-211-14.md`
- `2024-11-03-john-8-12-30.md`
- `2024-06-02-galatians-3-1-9.md`

### Taxonomy Regeneration

After the sync finishes, the workflow runs `yarn generate-taxonomies` – which rebuilds the preacher and series index pages under `sermons/` so the per-preacher and per-series sermon counts stay accurate.

### Error Handling

#### Episode-Level Errors

- Individual episode failures don't stop the entire sync
- Detailed error logging for troubleshooting
- Graceful handling of malformed RSS data

#### System-Level Errors

- Network failures abort the workflow with proper exit codes
- File system errors are logged and reported
- Git operations include safety checks

### Commit Messages

We commit with a plain summary line and a short body, varying by what changed.

Single episode:

```text
Add new sermon: John 21:1-14

Automated podcast sync from Saints Church RSS feed
```

Multiple episodes:

```text
Add 3 new sermon episodes

- John 21:1-14
- John 20:19-31
- John 20:1-18

Automated podcast sync
```

### Monitoring and Maintenance

#### Checking Workflow Status

1. Go to **Actions** tab in GitHub repository
2. Select **Sync Podcast Episodes** workflow
3. View recent runs and their status

#### Manual Triggering

1. Navigate to **Actions** → **Sync Podcast Episodes**
2. Click **Run workflow** button
3. Confirm on desired branch (usually `master`)

#### Tracking File Location

Processed episodes are tracked in: `_data/processed_episodes.json`

This file contains:

```json
[
  {
    "guid": "episode-unique-identifier",
    "title": "Episode Title",
    "filename": "2025-09-14-episode-title.md",
    "processed_at": "2025-09-17T18:10:49.187Z"
  }
]
```

#### Common Issues and Solutions

**Issue**: Episodes not appearing after sync

- Check workflow run logs in Actions tab
- Verify RSS feed is accessible
- Ensure episodes have unique GUIDs

**Issue**: Duplicate episodes created

- Check `_data/processed_episodes.json` for GUID tracking
- Verify workflow completed successfully on previous runs
- Manual cleanup may be needed if tracking file is corrupted

**Issue**: Scripture references not detected

- Check episode titles and descriptions for standard biblical reference formats
- Consider updating scripture extraction patterns in `scripts/sync-feed.js`
- Manual editing of generated posts may be needed for edge cases

**Issue**: Series not properly assigned

- Verify expository preaching follows recognizable patterns
- Check that series detection logic covers your biblical books
- Manual frontmatter editing can correct series assignments

### Dependencies

Dependencies are installed with `yarn install --frozen-lockfile`, and the Node version comes from `.nvmrc`. The sync itself needs `rss-parser`; the taxonomy step needs `tsx`. Both are declared in `package.json`.

### Security Considerations

- Workflow runs with `contents: write` permission for Git operations
- No external secrets or API keys required
- RSS feed access is read-only
- All commits are properly attributed

### Customization

To modify the workflow behavior:

1. **Change Schedule**: Edit the `cron` expression in the workflow file
2. **RSS Feed URL**: Update the `RSS_URL` constant in `scripts/sync-feed.js`
3. **Scripture Patterns**: Modify the `extractScripture` function in `scripts/sync-feed.js`
4. **Series Detection**: Adjust `SERIES_THRESHOLD` in `scripts/sync-feed.js`
5. **Post Frontmatter**: Adjust `buildFields` / `buildFrontmatter` in `scripts/sync-feed.js`

### Integration with Jekyll

This workflow integrates seamlessly with:

- Jekyll's `_posts` directory structure
- The existing `sermon` layout
- Site's frontmatter conventions
- Git-based content management

Posts are immediately available for Jekyll building and deployment upon workflow completion.
