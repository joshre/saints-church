"""
Utility functions for sermon processing
"""

import re


def format_description(description: str) -> str:
    """
    Convert HTML and bullet characters to proper markdown format.

    Handles:
    - HTML tags (<p>, <ul>, <li>, <br>) -> markdown
    - Bullet characters (•) -> markdown bullets (-)
    - Literal \n strings -> actual newlines
    - Proper spacing and line breaks

    Args:
        description: Raw description from RSS feed (may contain HTML or bullet chars)

    Returns:
        Clean markdown-formatted description
    """
    # Remove any existing quotes
    description = description.strip('"\'')

    # If it contains HTML tags, convert to markdown
    if '<p>' in description or '<ul>' in description or '<li>' in description:
        # Convert HTML list items to markdown with proper line breaks
        description = re.sub(r'<li><p>(.*?)</p></li>', r'\n- \1', description, flags=re.DOTALL)
        description = re.sub(r'<li>(.*?)</li>', r'\n- \1', description, flags=re.DOTALL)

        # Remove paragraph tags
        description = re.sub(r'<p>(.*?)</p>', r'\1\n\n', description, flags=re.DOTALL)

        # Remove ul/ol tags
        description = description.replace('<ul>', '').replace('</ul>', '')
        description = description.replace('<ol>', '').replace('</ol>', '')

        # Clean up <br> tags
        description = description.replace('<br>', '\n').replace('<br/>', '\n').replace('<br />', '\n')

        # Remove any other HTML tags
        description = re.sub(r'<[^>]+>', '', description)

    # Replace all bullet characters with markdown bullets
    description = description.replace('•', '-')

    # Remove literal \n strings (backslash-n, not newlines)
    description = description.replace('\\n', '\n')

    # Fix bullets that are on the same line (missing newlines between them)
    # Pattern: "text.- " should become "text.\n- "
    description = re.sub(r'([.!?])-\s+', r'\1\n- ', description)

    # Fix any bullets that don't have space after dash
    description = re.sub(r'^-(\S)', r'- \1', description, flags=re.MULTILINE)

    # Fix any bullets mid-line that don't have space after dash
    description = re.sub(r'([^\n])-([A-Z])', r'\1\n- \2', description)

    # Clean up excessive newlines (3+ becomes 2)
    description = re.sub(r'\n\n\n+', '\n\n', description)
    description = description.strip()

    return description
