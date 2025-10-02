#!/usr/bin/env python3
"""
Remove duplicate HTML description content from sermon body
(content between frontmatter and transcription)
"""

import re
from pathlib import Path


def parse_frontmatter(content: str):
    """Parse Jekyll frontmatter"""
    if not content.startswith('---\n'):
        return {}, content

    end_match = re.search(r'\n---\n', content[4:])
    if not end_match:
        return {}, content

    frontmatter_end = end_match.end() + 4
    frontmatter_text = content[4:end_match.start() + 4]
    remaining_content = content[frontmatter_end:]

    return frontmatter_text, frontmatter_end, remaining_content


def clean_sermon_file(filepath: Path) -> bool:
    """Remove HTML body content if present"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        frontmatter_text, frontmatter_end, body = parse_frontmatter(content)

        # Check if body starts with HTML tags before transcription
        # Pattern: newlines, then HTML, then ## Transcription
        transcription_match = re.search(r'## Transcription', body)

        if not transcription_match:
            return False

        before_transcription = body[:transcription_match.start()].strip()

        # If there's HTML content before transcription, remove it
        if before_transcription and ('<p>' in before_transcription or '<ul>' in before_transcription):
            # Reconstruct file with just frontmatter and transcription
            new_content = content[:frontmatter_end]
            new_content += '\n'  # Single newline after frontmatter
            new_content += body[transcription_match.start():]

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)

            print(f"✅ Cleaned: {filepath.name}")
            return True
        else:
            return False

    except Exception as e:
        print(f"❌ Error processing {filepath.name}: {e}")
        return False


def main():
    posts_dir = Path('_posts')

    if not posts_dir.exists():
        print("❌ _posts directory not found")
        return

    md_files = sorted(posts_dir.glob('*.md'), reverse=True)

    print("🧹 Cleaning duplicate HTML body content...")
    print(f"📁 Checking {len(md_files)} files\n")

    cleaned_count = 0

    for filepath in md_files:
        if clean_sermon_file(filepath):
            cleaned_count += 1

    print(f"\n✅ Cleaned {cleaned_count}/{len(md_files)} files")

    if cleaned_count == 0:
        print("🎉 No files needed cleaning!")


if __name__ == "__main__":
    main()
