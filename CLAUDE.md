# Saints Church Jekyll Site - Project Documentation

## Master Claude Configuration System

**Global Agents Available**: This project is part of the Master Claude Configuration System.
- **Master Config**: `/Users/josh/web/_projects/cortex/claude-master/`
- **Global Agents**: `analysis`, `blog-publisher`, `deployment`, `documentation`, `jira-issue`, `lesson-plan`, `seo-pages`, `testing`, `work-log`

### Quick Work Logging
```
"Use work-log agent: Updated sermon transcription system"
"Log work: Fixed responsive design issues on mobile"
```

----

## Project Overview
Saints Church is a Reformed Baptist church website built with Jekyll, featuring sophisticated design, custom animations, and comprehensive SEO optimization for local church discovery in Knoxville, TN.

## Architecture & Technology Stack

### Core Technologies
- **Jekyll** - Static site generator (GitHub Pages compatible)
- **Tailwind CSS v4** - Utility-first CSS framework with custom theme
- **JavaScript** - IntersectionObserver-based animations
- **Node.js/Yarn** - Build tools and package management

### Key Design Principles
- **Sophisticated Restraint** - "Expensive minimalism" with "ultrathinking"
- **One Effect Per Section** - Avoid "decorative chaos"
- **GPU-Only Animations** - 60fps performance optimization
- **Content-First** - Authentic church voice over generic templates

## Site Structure

### Pages
- **Homepage** (`index.md`) - Main landing page with Acts 2:42-47 sections
- **Sermons** (`sermons.md`) - Sermon archive with audio player and transcriptions
- **Beliefs** (`beliefs.md`) - Confessional Baptist identity and doctrine
- **Pastor Letter** (`pastor-letter.md`) - Personal letter from Pastor Nate Ellis

### Include Components

**Page Sections** (Homepage components):
- `header.html` - Hero section with church info, animations (formerly `hero.html`)
- `mission.html` - Acts 2:42-47 passage with modal
- `teaching.html` - Expository preaching section
- `fellowship.html` - Community life (renamed from `people.html`)
- `breaking-bread.html` - Lord's Supper and meals together
- `prayer.html` - Family and communal prayer
- `values.html` - How we gather (6 key areas)
- `schedule.html` - Sunday morning timeline
- `about-us.html` - Church history and family church

**Navigation & Layout**:
- `nav.html` - Main navigation
- `subnav.html` - Secondary navigation
- `footer.html` - Footer with contact info

**Utility Components**:
- `audio-player.html` - Sermon audio player with controls
- `pastor-image.html` - Optimized pastor image with multiple formats
- `responsive-image.html` - Multi-format image component
- `button.html` / `button-group.html` - Button components
- `icon.html` - SVG icon system
- `logo.html` - Church logo component
- `visit-modal.html` - Visit us modal with map/directions
- `subscribe-buttons.html` - Podcast subscription buttons
- `podcast-platforms.html` - Podcast platform links

**Sermon Components**:
- `sermon-card.html` - Sermon preview card
- `sermon-schema.html` - Sermon structured data
- `page-schema.html` - Page structured data

**Utility Includes**:
- `cta.html` / `page-cta.html` - Call-to-action sections
- `section-break.html` - Visual section dividers
- `image-section.html` - Image section layouts

## Design System

### Color Palette
- **Saints Colors**: `#231f20` (black), `#f7f6f3` (white)

### Typography
- **Display Font**: PP Formula (headings)
- **Body Font**: Inter Variable (content)
- **Font Features**: Optimized with font-feature-settings

### Animation System
- **Custom Bezier**: `cubic-bezier(0.4, 0.01, 0.165, 0.99)`
- **Hero Bezier**: `cubic-bezier(0.2, 0, 0.13, 1)`
- **Durations**: Fast (0.2s), Normal (0.3s), Reveal (0.9s)

#### Animation Classes
```css
/* Parent-triggered child animations */
.animate-children .child {
  --delay: 0s;
  --duration: var(--animation-reveal);
  --translate-y: 1rem;
  /* Uses IntersectionObserver to add .run class */
}
```

#### Usage Pattern
```html
<div class="animate-children">
  <h2 class="child">Title</h2>
  <p class="child [--delay:0.15s]">Content</p>
  <div class="child [--delay:0.25s]">More content</div>
</div>
```

## Key Features

### SEO Optimization
- **Local Church SEO**: Knoxville LBC Reformed Baptist targeting
- **Schema Markup**: Church organization structured data
- **Meta Tags**: Comprehensive social media and search optimization
- **Sitemap**: Dynamic XML sitemap with proper priorities

### Church Information
- **Address**: 11213 Outlet Dr, Knoxville, TN 37932
- **Service Time**: Sundays 9:30 AM
- **Denomination**: London Baptist Confession (LBC) Reformed Baptist
- **Structure**: Acts 2:42-47 based (Teaching, Fellowship, Breaking Bread, Prayer)

### Performance Optimizations
- **Image Formats**: AVIF, WebP, JPG fallbacks
- **GPU Animations**: `translate3d()` transforms
- **Font Loading**: Optimized with `font-display: swap`
- **Mobile-First**: Responsive design with touch optimizations

## File Structure
```
/
├── _css/
│   └── input.css              # Main stylesheet with animations
├── _includes/
│   ├── header.html            # Hero section (was hero.html)
│   ├── nav.html               # Navigation
│   ├── mission.html           # Acts 2 passage
│   ├── teaching.html          # Preaching section
│   ├── fellowship.html        # Community (was people.html)
│   ├── breaking-bread.html    # Lord's Supper
│   ├── prayer.html            # Prayer sections
│   ├── values.html            # How we gather
│   ├── schedule.html          # Sunday timeline
│   ├── about-us.html          # Church history
│   ├── footer.html            # Footer
│   ├── visit-modal.html       # Visit modal
│   └── pastor-image.html      # Optimized pastor image
├── _layouts/
│   ├── compress.html          # HTML compression wrapper
│   ├── default.html           # Base layout
│   ├── page.html              # Page layout
│   └── sermon.html            # Sermon post layout
├── _data/
│   ├── content.yml            # Site content (CRITICAL: all text here)
│   └── processed_episodes.json # Podcast sync tracking
├── assets/
│   ├── css/                   # Generated CSS
│   ├── fonts/                 # PP Formula, Inter Variable
│   └── images/
│       ├── pastor.avif        # 14KB (was 278KB PNG)
│       ├── pastor.webp        # 13KB
│       └── pastor.jpg         # 41KB fallback
├── js/
│   ├── site.js                # Main JavaScript (gets bundled)
│   └── site.min.js            # Bundled JavaScript output
├── index.md                   # Homepage
├── beliefs.md                 # Beliefs page
├── pastor-letter.md           # Pastor letter
├── sitemap.xml                # Dynamic sitemap
├── package.json               # Dependencies
└── .gitignore                 # Jekyll + Node gitignore
```

## Animation Implementation

### JavaScript (js/site.js - bundled into site.min.js)
Main JavaScript file that gets bundled with Estrella build tool. Contains:
- Tailwind Elements import
- IntersectionObserver-based animations
- Mobile-optimized thresholds for reliable animation triggering
- Multiple threshold values `[0, 0.01, 0.05]` for long content containers

### CSS Custom Properties
Uses Tailwind arbitrary properties for overrides:
```html
<div class="child [--delay:0.15s] [--translate-y:0.25rem]">
```

### Sermon Transcription Display
The sermon layout (`_layouts/sermon.html`) uses intelligent transcription detection:
- Tries multiple methods to find transcriptions: markdown headers, HTML headers, simple contains
- Displays transcriptions in collapsible `<details>` element
- Shows "Full Transcription" toggle by default (open state)
- Falls back to "Transcription coming soon..." if no content found
- Hides empty `<p><br></p>` tags for clean rendering

## Content Management

### Content Data File
**CRITICAL**: All content changes must be made in `_data/content.yml`, never hardcoded in templates.

- Site content is centrally managed in `_data/content.yml`
- Access content via `{{ site.data.content.section.field }}`
- Never hardcode text directly in HTML/Liquid templates
- Always update content.yml when changing any text or messaging

### Acts 2:42-47 Structure
1. **Teaching** - Verse-by-verse expository preaching
2. **Fellowship** - Community life and relationships
3. **Breaking of Bread** - Lord's Supper weekly + meals together
4. **Prayer** - Family prayer + communal prayer gatherings

### Church Identity
- **Confessional Baptist** - London Baptist Confession of Faith 1689
- **Reformed Theology** - Sola scriptura, sola gratia, sola fide
- **Family Integrated** - All ages worship together
- **Community Focused** - Elder's business office, room for growth

## Automation & Workflows

### GitHub Actions
The site uses automated workflows in `.github/workflows/`:

**Podcast Sync** (`podcast-sync.yml`):
- Runs weekly on Sundays at 9:00 AM UTC
- Automatically syncs sermon episodes from RSS feed
- Creates Jekyll posts with proper frontmatter
- Prevents duplicates using GUID tracking in `_data/processed_episodes.json`
- Detects biblical book series for expository preaching
- Can be triggered manually via workflow_dispatch

**Update Icons** (`update-icons.yml`):
- Runs weekly on Mondays at 2:00 AM UTC
- Checks for Heroicons updates and regenerates icon set
- Can be triggered manually via workflow_dispatch
- Uses script at `scripts/generate-icons.js`

**Claude Code Review** (`claude-code-review.yml`):
- Runs on pull request events (opened, synchronize)
- Provides automated code review feedback

### Sermon Transcription Workflow
Sermons can be transcribed using Whisper large-v3 locally:
1. Script location: `scripts/transcribe.py`
2. Uses WhisperX for high-quality transcription
3. Audio files downloaded and processed locally
4. Transcriptions added to sermon markdown files under `## Transcription` heading
5. Sermon layout automatically detects and displays transcriptions in collapsible section
6. Python virtual environment in `whisper_env/` or `venv/`

## Development Notes

### Build Commands
```bash
yarn install          # Install dependencies
yarn build            # Build CSS
yarn watch             # Watch mode
bundle exec jekyll serve  # Serve locally
```

### Available Scripts (`scripts/`)
- `transcribe.py` - Whisper-based sermon transcription
- `sync-feed.js` - Manual podcast feed sync
- `generate-icons.js` - Regenerate Heroicons SVG set
- `validate_descriptions.py` - Validate sermon descriptions
- `clean_body_content.py` - Clean/format sermon content
- `utils.py` - Shared utility functions

### Animation Debugging
- Text jitter fixed with `text-rendering: geometricPrecision`
- GPU acceleration with `translate3d()`
- Consistent font smoothing properties

### Recent Changes

**January 2026**:
- Fixed GitHub Pages build failures caused by CLAUDE.md symlink
- Added sermon transcriptions for Acts 10, 11, and 12
- Added exclude list to `_config.yml` for build optimization
- Converted CLAUDE.md from symlink to real file

**Earlier**:
- Renamed `hero.html` → `header.html`
- Renamed `people.html` → `fellowship.html`
- Applied animate-children pattern to all sections
- Optimized pastor image (95% size reduction)
- Fixed text rendering consistency
- Added comprehensive gitignore

## Future Enhancements
- Podcast integration with Cloudflare caching
- Additional animation refinements
- Performance monitoring
- A11y improvements

## Pastor Information
- **Name**: Pastor Nate Ellis
- **Image**: Optimized in multiple formats
- **Content**: Personal, authentic voice in beliefs and letter pages
