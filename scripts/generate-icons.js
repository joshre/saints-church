#!/usr/bin/env node

/**
 * Generate Heroicons include file from SVG sources
 * This script reads all Heroicons SVG files and generates a Jekyll include
 * that can dynamically serve any icon without hardcoding paths.
 */

const fs = require('fs');
const path = require('path');

const HEROICONS_DIR = 'assets/heroicons/optimized';
const OUTPUT_FILE = '_includes/icon.html';

// Scan codebase to find which icons are actually used
function findUsedIcons() {
  const scanDirs = ['_includes', '_layouts'];
  const scanGlobs = ['*.html', '*.md'];
  const iconPattern = /include icon\.html name="([^"]+)"/g;
  const used = new Set();

  function scanFile(filePath) {
    // Don't scan the output file itself
    if (filePath === OUTPUT_FILE) return;
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = iconPattern.exec(content)) !== null) {
      used.add(match[1]);
    }
  }

  // Scan directories recursively
  for (const dir of scanDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir, { recursive: true });
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isFile() && /\.(html|md)$/.test(file)) {
        scanFile(filePath);
      }
    }
  }

  // Scan root-level files
  for (const pattern of scanGlobs) {
    const ext = pattern.replace('*.', '.');
    const rootFiles = fs.readdirSync('.').filter(f => f.endsWith(ext));
    for (const file of rootFiles) {
      scanFile(file);
    }
  }

  return used;
}

function readSVGContent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Extract just the path content from the SVG
  const pathMatch = content.match(/<path[^>]*d="([^"]*)"[^>]*>/g);
  if (pathMatch) {
    return pathMatch.join('');
  }
  return content.replace(/<\?xml[^>]*>/, '').replace(/<svg[^>]*>/, '').replace('</svg>', '').trim();
}

function generateIconCases(usedIcons) {
  const sizes = ['16', '20', '24'];
  const types = ['outline', 'solid'];
  const iconData = {};

  // Read all icon files
  for (const size of sizes) {
    for (const type of types) {
      const dir = path.join(HEROICONS_DIR, size, type);
      if (!fs.existsSync(dir)) continue;

      const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

      for (const file of files) {
        const iconName = file.replace('.svg', '');

        // Skip icons not used in the codebase
        if (!usedIcons.has(iconName)) continue;

        const filePath = path.join(dir, file);

        if (!iconData[iconName]) {
          iconData[iconName] = {};
        }
        if (!iconData[iconName][size]) {
          iconData[iconName][size] = {};
        }

        iconData[iconName][size][type] = readSVGContent(filePath);
      }
    }
  }

  // Generate Liquid template cases with proper elsif chains
  let cases = '';
  for (const [iconName, sizeData] of Object.entries(iconData)) {
    cases += `  {% when "${iconName}" %}\n`;

    // Build ordered conditions (non-default first, default last)
    const conditions = [];
    let defaultContent = null;

    for (const [size, typeData] of Object.entries(sizeData)) {
      for (const [type, svgContent] of Object.entries(typeData)) {
        // 24px outline is the default case
        if (size === '24' && type === 'outline') {
          defaultContent = {
            svgContent,
            isStroke: true
          };
        } else {
          conditions.push({
            condition: `icon_size == "${size}" and icon_type == "${type}"`,
            svgContent,
            isStroke: type === 'outline'
          });
        }
      }
    }

    // Generate if/elsif chain
    conditions.forEach((item, index) => {
      const keyword = index === 0 ? 'if' : 'elsif';
      cases += `    {% ${keyword} ${item.condition} %}\n`;
      cases += `      {% assign icon_svg = '${item.svgContent.replace(/'/g, "\\'")}' %}\n`;
      cases += `      {% assign is_stroke = ${item.isStroke ? 'true' : 'false'} %}\n`;
    });

    // Add default case (24px outline)
    if (defaultContent) {
      cases += `    {% else %}\n`;
      cases += `      {% assign icon_svg = '${defaultContent.svgContent.replace(/'/g, "\\'")}' %}\n`;
      cases += `      {% assign is_stroke = ${defaultContent.isStroke ? 'true' : 'false'} %}\n`;
    }

    cases += `    {% endif %}\n\n`;
  }

  return cases;
}

function generateTemplate(usedIcons) {
  const iconCases = generateIconCases(usedIcons);

  return `{% comment %}
Auto-generated Heroicons component
Generated from SVG files in assets/heroicons/optimized/
Run 'node scripts/generate-icons.js' to regenerate after updating Heroicons

Usage:
  {% include icon.html name="arrow-uturn-left" class="size-4" %}
  {% include icon.html name="arrow-uturn-left" type="micro" class="size-4" %}
  {% include icon.html name="play" type="solid" class="size-6" %}

Parameters:
- name: Icon name (e.g., "arrow-uturn-left", "play", "pause")
- type: "outline" (default), "solid", "micro" (for 16px icons)
- class: CSS classes (default: "size-6")
- size: Icon size - "16", "20", "24" (default: "24")
{% endcomment %}

{% assign icon_type = include.type | default: "outline" %}
{% assign icon_size = include.size | default: "24" %}
{% assign default_class = include.class | default: "size-6" %}

{% comment %}Handle micro icons (16px){% endcomment %}
{% if include.type == "micro" %}
  {% assign icon_size = "16" %}
  {% assign icon_type = "solid" %}
{% endif %}

{% case include.name %}
${iconCases}{% endcase %}

{% comment %}Render the icon{% endcomment %}
{% assign viewbox_size = icon_size | default: "24" %}
{% if is_stroke %}
<svg class="{{ default_class }}" fill="none" stroke="currentColor" viewBox="0 0 {{ viewbox_size }} {{ viewbox_size }}" xmlns="http://www.w3.org/2000/svg">
  {{ icon_svg }}
</svg>
{% else %}
<svg class="{{ default_class }}" fill="currentColor" viewBox="0 0 {{ viewbox_size }} {{ viewbox_size }}" xmlns="http://www.w3.org/2000/svg">
  {{ icon_svg }}
</svg>
{% endif %}`;
}

// Generate and write the template
console.log('Scanning codebase for icon usage...');
const usedIcons = findUsedIcons();
console.log(`Found ${usedIcons.size} icons in use: ${[...usedIcons].sort().join(', ')}`);
const template = generateTemplate(usedIcons);
fs.writeFileSync(OUTPUT_FILE, template);
console.log(`Generated ${OUTPUT_FILE} (${usedIcons.size} icons, was 324)`);