# Saints Church Jekyll Site - Project Documentation

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
- **Beliefs** (`beliefs.md`) - Confessional Baptist identity and doctrine
- **Pastor Letter** (`pastor-letter.md`) - Personal letter from Pastor Nate Ellis

### Include Components
- `header.html` - Hero section with church info, animations (formerly `hero.html`)
- `nav.html` - Navigation component
- `mission.html` - Acts 2:42-47 passage with modal
- `teaching.html` - Expository preaching section
- `fellowship.html` - Community life (renamed from `people.html`)
- `breaking-bread.html` - Lord's Supper and meals together
- `prayer.html` - Family and communal prayer
- `values.html` - How we gather (6 key areas)
- `schedule.html` - Sunday morning timeline
- `about-us.html` - Church history and family church
- `footer.html` - Footer with contact info
- `visit-modal.html` - Visit us modal with map/directions
- `pastor-image.html` - Optimized pastor image component

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
│   └── default.html           # Base layout
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

## Development Notes

### Build Commands
```bash
yarn install          # Install dependencies
yarn build            # Build CSS
yarn watch             # Watch mode
bundle exec jekyll serve  # Serve locally
```

### Animation Debugging
- Text jitter fixed with `text-rendering: geometricPrecision`
- GPU acceleration with `translate3d()`
- Consistent font smoothing properties

### Recent Changes
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