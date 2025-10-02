#!/usr/bin/env python3
"""
Validate all sermon descriptions are properly formatted
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

    frontmatter_text = content[4:end_match.start() + 4]
    remaining_content = content[end_match.end() + 4:]

    frontmatter = {}
    current_key = None
    current_value = []

    for line in frontmatter_text.split('\n'):
        if ':' in line and not line.startswith(' '):
            if current_key:
                frontmatter[current_key] = '\n'.join(current_value).strip().strip('"\'')
            key, value = line.split(':', 1)
            current_key = key.strip()
            current_value = [value.strip()]
        elif current_key and line.strip():
            current_value.append(line.strip())

    if current_key:
        frontmatter[current_key] = '\n'.join(current_value).strip().strip('"\'')

    return frontmatter, remaining_content


def validate_description(description: str, filename: str):
    """Check for formatting issues"""
    issues = []

    # Check for HTML tags
    if '<p>' in description or '<ul>' in description or '<li>' in description or '<br>' in description:
        issues.append("❌ Contains HTML tags")

    # Check for bullet characters
    if '•' in description:
        issues.append("❌ Contains bullet character (•)")

    # Check for literal \n
    if '\\n' in description:
        issues.append("❌ Contains literal \\n")

    # Check for bullets running together (.- pattern)
    if re.search(r'\.-\s+[A-Z]', description):
        issues.append("❌ Bullets running together on same line")

    # Check for bullets without space after dash
    if re.search(r'^-[A-Z]', description, re.MULTILINE):
        issues.append("❌ Bullet missing space after dash")

    return issues


def main():
    posts_dir = Path('_posts')

    if not posts_dir.exists():
        print("❌ _posts directory not found")
        return

    md_files = sorted(posts_dir.glob('*.md'), reverse=True)

    print("🔍 Validating sermon descriptions...")
    print(f"📁 Checking {len(md_files)} files\n")

    total_issues = 0
    files_with_issues = 0
    files_without_description = 0
    clean_files = 0

    for filepath in md_files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            frontmatter, _ = parse_frontmatter(content)

            if 'description' not in frontmatter:
                files_without_description += 1
                continue

            description = frontmatter['description']
            issues = validate_description(description, filepath.name)

            if issues:
                print(f"\n📄 {filepath.name}")
                for issue in issues:
                    print(f"   {issue}")
                    total_issues += 1
                files_with_issues += 1

                # Show snippet
                preview = description[:150].replace('\n', ' ')
                print(f"   Preview: {preview}...")
            else:
                clean_files += 1

        except Exception as e:
            print(f"❌ Error reading {filepath.name}: {e}")

    # Summary
    print("\n" + "=" * 60)
    print("📊 VALIDATION SUMMARY")
    print("=" * 60)
    print(f"✅ Clean files: {clean_files}")
    print(f"⚠️  Files with issues: {files_with_issues}")
    print(f"📝 Total issues found: {total_issues}")
    print(f"❓ Files without description: {files_without_description}")
    print(f"📁 Total files checked: {len(md_files)}")

    if files_with_issues == 0:
        print("\n🎉 All descriptions are properly formatted!")
    else:
        print(f"\n⚠️  {files_with_issues} files need fixing")


if __name__ == "__main__":
    main()
