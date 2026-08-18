# Heroicons Integration

This project includes a comprehensive Heroicons integration that works seamlessly with GitHub Pages.

## How It Works

1. **Git Submodule**: Heroicons are included as a git submodule at `assets/heroicons/`
2. **Generated Template**: The `_includes/icon.html` file is auto-generated from SVG sources
3. **GitHub Actions**: Automatically updates icons weekly and on-demand
4. **GitHub Pages Compatible**: No build step required - works natively with GitHub Pages

## Usage

Use any Heroicon anywhere in your Jekyll site:

```liquid
{% comment %}Basic usage (24px outline by default){% endcomment %}
{% include icon.html name="home" %}

{% comment %}Micro icons (16px, perfect for small UI elements){% endcomment %}
{% include icon.html name="arrow-uturn-left" type="micro" class="size-4" %}

{% comment %}Solid icons{% endcomment %}
{% include icon.html name="star" type="solid" class="size-5" %}

{% comment %}20px icons{% endcomment %}
{% include icon.html name="user" size="20" class="size-5" %}

{% comment %}Custom classes{% endcomment %}
{% include icon.html name="heart" class="size-6 text-red-500" %}
```

### Parameters

- **name**: Icon name (e.g., "home", "user", "arrow-left")
- **type**: "outline" (default), "solid", "micro"
- **size**: "16", "20", "24" (default)
- **class**: CSS classes (default: "size-6")

## Available Icons

All official Heroicons are available:
- **292+ outline icons** (24px)
- **292+ solid icons** (24px)
- **230+ micro icons** (16px, solid style optimized for small sizes)
- **210+ 20px icons** (both outline and solid)

## Automatic Updates

### GitHub Actions (Recommended)

Icons automatically update via GitHub Actions:

- **Weekly check**: Every Monday at 2 AM UTC
- **Manual trigger**: Go to Actions → "Update Heroicons" → "Run workflow"
- **Auto-commit**: Changes are automatically committed when new icons are found

### Manual Updates

If you need to update manually:

```bash
# Update Heroicons to latest version
yarn update-icons

# Or step by step:
git submodule update --remote assets/heroicons
yarn generate-icons
```

## Technical Details

### File Structure
```
assets/heroicons/           # Git submodule
├── optimized/
│   ├── 16/solid/           # Micro icons
│   ├── 20/outline/         # 20px outline
│   ├── 20/solid/           # 20px solid
│   ├── 24/outline/         # 24px outline (default)
│   └── 24/solid/           # 24px solid
└── ...

_includes/icon.html         # Generated template (5000+ lines)
scripts/generate-icons.js   # Generator script
```

### Generation Process

1. Script reads all SVG files from `assets/heroicons/optimized/`
2. Extracts SVG path data from each file
3. Generates a comprehensive Liquid template with case statements
4. Template handles all size/type combinations dynamically

### GitHub Pages Compatibility

✅ **Works with GitHub Pages** because:
- No custom build process required
- Generated file is committed to repository
- Jekyll processes the template natively
- No plugins or custom Ruby required

## Examples in Saints Church

The audio player uses micro icons for perfect alignment:

```liquid
{% include icon.html name="arrow-uturn-left" type="micro" class="size-4" %}
{% include icon.html name="arrow-uturn-right" type="micro" class="size-4" %}
```

Other components use various sizes:

```liquid
{% include icon.html name="play" type="solid" class="size-6" %}
{% include icon.html name="download" class="size-5" %}
```

## Benefits

- **Site-wide consistency**: Same icon system everywhere
- **Always up-to-date**: Automatic updates via GitHub Actions
- **GitHub Pages compatible**: No build step required
- **Performance**: Only loads the exact SVG paths needed
- **Comprehensive**: All Heroicons available (900+ total icons)
- **Type-safe**: Fallback handling for missing icons
- **Flexible**: Support for all sizes and variants