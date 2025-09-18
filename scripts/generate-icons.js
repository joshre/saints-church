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

function readSVGContent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Extract just the path content from the SVG
  const pathMatch = content.match(/<path[^>]*d="([^"]*)"[^>]*>/g);
  if (pathMatch) {
    return pathMatch.join('');
  }
  return content.replace(/<\?xml[^>]*>/, '').replace(/<svg[^>]*>/, '').replace('</svg>', '').trim();
}

function generateIconCases() {
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

function generateTemplate() {
  const iconCases = generateIconCases();

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
console.log('Generating icon template from Heroicons SVG files...');
const template = generateTemplate();
fs.writeFileSync(OUTPUT_FILE, template);
console.log(`✅ Generated ${OUTPUT_FILE} with dynamic icon support`);
console.log('Icons will automatically update when Heroicons submodule is updated!');