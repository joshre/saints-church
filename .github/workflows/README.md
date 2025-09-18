# Saints Church GitHub Actions Workflows

This directory contains automated workflows for the Saints Church Jekyll website.

## Podcast Sync Workflow (`podcast-sync.yml`)

### Overview
Automatically syncs sermon episodes from the Saints Church RSS feed to Jekyll posts, optimized for Reformed Baptist expository preaching series.

### Features

#### 🎯 **RSS Feed Processing**
- Parses `https://anchor.fm/s/f5d78a70/podcast/rss`
- Extracts comprehensive episode metadata:
  - Title and description
  - Publication date
  - Audio URL and duration
  - Unique GUID for duplicate prevention
  - iTunes metadata (author, duration, etc.)

#### 📝 **Jekyll Post Generation**
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

#### ⛪ **Reformed Baptist Context**
- **Enhanced Scripture References**: Detects biblical references in multiple formats:
  - Full book names: "John 21:1-14", "1 Corinthians 15:1-11"
  - Abbreviated forms: "Jn 21:1-14", "1Cor 15:1-11"
  - Roman numerals: "I Corinthians 15:1-11"
  - Single chapter books: "Philemon v. 1-7"

- **Series Detection**: Automatically identifies sermon series:
  - Explicit series patterns: "Series Name: Episode Title"
  - Biblical book series for expository preaching (John, Galatians, Romans, etc.)

- **Pastor Attribution**: Defaults to "Pastor Nate Ellis" with RSS feed fallback

#### 🔄 **Duplicate Prevention**
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

#### Single Episode
```
Add new sermon: John 21:1-14

🎯 Automated podcast sync from Saints Church RSS feed
📅 Weekly sync for Reformed Baptist sermon series

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Multiple Episodes
```
Add 3 new sermon episodes

🎯 Automated podcast sync from Saints Church RSS feed
📅 Weekly sync for Reformed Baptist sermon series

Recent episodes:
- John 21:1-14
- John 20:19-31
- John 20:1-18

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
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
- Consider updating scripture extraction patterns in workflow
- Manual editing of generated posts may be needed for edge cases

**Issue**: Series not properly assigned
- Verify expository preaching follows recognizable patterns
- Check that series detection logic covers your biblical books
- Manual frontmatter editing can correct series assignments

### Dependencies

The workflow automatically installs these Node.js packages:
- `rss-parser@^3.13.0` - RSS feed parsing
- `front-matter@^4.0.2` - Jekyll frontmatter handling

### Security Considerations

- Workflow runs with `contents: write` permission for Git operations
- No external secrets or API keys required
- RSS feed access is read-only
- All commits are properly attributed and signed

### Customization

To modify the workflow behavior:

1. **Change Schedule**: Edit the `cron` expression in the workflow file
2. **RSS Feed URL**: Update the `RSS_URL` constant in the JavaScript
3. **Scripture Patterns**: Modify the `extractScripture` function patterns
4. **Series Detection**: Update the series detection logic
5. **Post Template**: Adjust the `generatePost` function frontmatter

### Integration with Jekyll

This workflow integrates seamlessly with:
- Jekyll's `_posts` directory structure
- The existing `sermon` layout
- Site's frontmatter conventions
- Git-based content management

Posts are immediately available for Jekyll building and deployment upon workflow completion.