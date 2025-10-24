#!/usr/bin/env python3
"""
Saints Church Sermon Transcription
Uses Whisper Large-V3-Turbo for fast, accurate transcription
Automatically formats descriptions to markdown
"""

import os
import re
import sys
import json
import tempfile
import requests
import whisper
import time
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

# Import description formatter
from utils import format_description

@dataclass
class SermonFile:
    filepath: str
    filename: str
    date: str
    title: str
    audio_url: str
    content: str
    frontmatter: Dict

class WorkingTranscriptionProcessor:
    def __init__(self):
        self.temp_dir = Path(tempfile.mkdtemp(prefix="sermon_audio_working_"))
        self.model = None
        self.processed_count = 0
        self.total_count = 0
        self.errors = []
        self.completed_sermons = []
        self.start_time = time.time()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def load_whisper_model(self):
        """Load Whisper LARGE-V3-TURBO model - distilled and stable"""
        if self.model is None:
            print("⚡ Loading Whisper LARGE-V3-TURBO model for fast, stable transcription...")
            self.model = whisper.load_model("large-v3-turbo")
            print("✅ Large-V3-Turbo model loaded successfully!")
        return self.model

    def parse_frontmatter(self, content: str) -> Tuple[Dict, str]:
        """Parse Jekyll frontmatter"""
        if not content.startswith('---\n'):
            return {}, content

        end_match = re.search(r'\n---\n', content[4:])
        if not end_match:
            return {}, content

        frontmatter_text = content[4:end_match.start() + 4]
        remaining_content = content[end_match.end() + 4:]

        frontmatter = {}
        for line in frontmatter_text.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip().strip('"\'')
                frontmatter[key] = value

        return frontmatter, remaining_content

    def get_all_sermons(self) -> List[SermonFile]:
        """Get ALL sermon files that need transcription"""
        posts_dir = Path(__file__).parent.parent / '_posts'
        sermon_files = []

        md_files = sorted(posts_dir.glob('*.md'), reverse=True)

        for filepath in md_files:
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                if "## Transcription" in content:
                    continue

                frontmatter, body = self.parse_frontmatter(content)
                audio_url = frontmatter.get('audio_url')
                if not audio_url:
                    continue

                date_match = re.match(r'(\d{4}-\d{2}-\d{2})', filepath.name)
                date = date_match.group(1) if date_match else "unknown"

                sermon_files.append(SermonFile(
                    filepath=str(filepath),
                    filename=filepath.name,
                    date=date,
                    title=frontmatter.get('title', 'Unknown'),
                    audio_url=audio_url,
                    content=content,
                    frontmatter=frontmatter
                ))

            except Exception as e:
                print(f"❌ Error reading {filepath}: {e}")

        return sermon_files

    def download_audio(self, sermon: SermonFile) -> Optional[Path]:
        """Download audio file"""
        try:
            elapsed = time.time() - self.start_time
            rate = self.processed_count / (elapsed / 3600) if elapsed > 0 and self.processed_count > 0 else 0
            remaining_est = (self.total_count - self.processed_count) / rate if rate > 0 else 0

            print(f"📥 [{self.processed_count + 1}/{self.total_count}] Downloading: {sermon.title}")
            if remaining_est > 0:
                print(f"⏱️  Estimated remaining: {remaining_est:.1f} hours")

            response = requests.get(sermon.audio_url, stream=True, timeout=60)
            response.raise_for_status()

            ext = '.m4a'
            if '.' in sermon.audio_url.split('/')[-1]:
                ext = '.' + sermon.audio_url.split('.')[-1].split('?')[0]

            audio_file = self.temp_dir / f"{sermon.date}_{sermon.filename.replace('.md', ext)}"

            with open(audio_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            size_mb = audio_file.stat().st_size / 1024 / 1024
            print(f"✅ Downloaded: {size_mb:.1f} MB")
            return audio_file

        except Exception as e:
            error_msg = f"Download failed for {sermon.title}: {e}"
            print(f"❌ {error_msg}")
            self.errors.append(error_msg)
            return None

    def transcribe_audio(self, audio_file: Path, sermon: SermonFile) -> Optional[str]:
        """Transcribe with contextual prompt from sermon description"""
        try:
            print(f"🎤 [{self.processed_count + 1}/{self.total_count}] Transcribing: {sermon.title}")

            model = self.load_whisper_model()

            # Create contextual prompt from sermon description
            description = sermon.frontmatter.get('description', '')
            # Strip HTML tags from description for cleaner prompt
            import html
            clean_description = re.sub(r'<[^>]+>', '', html.unescape(description))

            initial_prompt = f"This is a sermon by Pastor Nate Ellis on {sermon.title}. {clean_description[:200]}..."

            # Better Whisper settings for sermon transcription
            result = model.transcribe(
                str(audio_file),
                language="en",
                verbose=False,
                temperature=0.0,
                beam_size=5,
                best_of=5,
                patience=1.0,
                length_penalty=1.0,
                suppress_tokens=[-1],
                initial_prompt=initial_prompt,
                condition_on_previous_text=True,
                fp16=False
            )

            transcription = result["text"].strip()

            # Basic cleanup - let Whisper handle most formatting
            transcription = re.sub(r'\s+', ' ', transcription)
            transcription = re.sub(r'([.!?])\s*([A-Z])', r'\1\n\n\2', transcription)

            print(f"✅ Transcribed: {len(transcription):,} characters")
            return transcription

        except Exception as e:
            error_msg = f"Transcription failed for {sermon.title}: {e}"
            print(f"❌ {error_msg}")
            self.errors.append(error_msg)
            return None

    def update_sermon_file(self, sermon: SermonFile, transcription: str):
        """Update sermon file with transcription and formatted description"""
        try:
            frontmatter, body = self.parse_frontmatter(sermon.content)

            # Format description to clean markdown
            if 'description' in frontmatter:
                frontmatter['description'] = format_description(frontmatter['description'])

            new_content = "---\n"
            for key, value in frontmatter.items():
                if isinstance(value, str) and any(char in value for char in ['"', ':', '\n']):
                    new_content += f'{key}: "{value.replace('"', '\\"')}"\n'
                else:
                    new_content += f"{key}: {value}\n"

            # Add transcription model information
            new_content += f"transcription_model: whisper-large-v3-turbo\n"
            new_content += "---\n\n"

            if body.strip():
                new_content += body.strip() + "\n\n"

            new_content += "## Transcription\n\n"
            new_content += transcription + "\n"

            with open(sermon.filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)

            print(f"💾 Updated: {sermon.filename}")

        except Exception as e:
            error_msg = f"File update failed for {sermon.filename}: {e}"
            print(f"❌ {error_msg}")
            self.errors.append(error_msg)

    def process_sermon(self, sermon: SermonFile) -> bool:
        """Process single sermon"""
        try:
            print(f"\n🎯 Processing: {sermon.date} - {sermon.title}")

            audio_file = self.download_audio(sermon)
            if not audio_file:
                return False

            transcription = self.transcribe_audio(audio_file, sermon)
            if not transcription:
                return False

            self.update_sermon_file(sermon, transcription)
            audio_file.unlink(missing_ok=True)

            self.processed_count += 1
            self.completed_sermons.append(sermon.filename)

            remaining = self.total_count - self.processed_count
            elapsed = time.time() - self.start_time
            rate = self.processed_count / (elapsed / 3600) if elapsed > 0 else 0
            remaining_est = remaining / rate if rate > 0 else 0

            print(f"🎉 SUCCESS! {self.processed_count}/{self.total_count} completed")
            print(f"📈 Rate: {rate:.1f} sermons/hour")
            print(f"⏱️  Remaining: {remaining_est:.1f} hours ({remaining} sermons)")

            return True

        except Exception as e:
            error_msg = f"Processing failed for {sermon.title}: {e}"
            print(f"❌ {error_msg}")
            self.errors.append(error_msg)
            return False

    def process_all_sermons(self):
        """Process all sermons reliably"""
        print("🔧 Saints Church WORKING Transcription System")
        print("=" * 60)
        print("⚡ Large-V3-Turbo model for fast, stable transcription")
        print("🎯 Single-threaded for stability")
        print("🔄 Will complete 100% of sermons")
        print("=" * 60)

        sermons = self.get_all_sermons()
        if not sermons:
            print("✅ No sermons need transcription!")
            return

        self.total_count = len(sermons)
        self.start_time = time.time()

        print(f"\n📊 Processing {len(sermons)} sermons")
        print(f"⏱️  Estimated time: {len(sermons) * 8 / 60:.1f} hours (large-v3 model)")
        print()

        # Process one by one for maximum reliability
        for i, sermon in enumerate(sermons):
            print(f"\n{'='*20} SERMON {i+1}/{len(sermons)} {'='*20}")
            success = self.process_sermon(sermon)

        # Final report
        elapsed = time.time() - self.start_time
        print("\n" + "=" * 60)
        print("🏆 TRANSCRIPTION COMPLETE!")
        print("=" * 60)
        print(f"✅ Successfully processed: {self.processed_count}/{self.total_count}")
        print(f"⏱️  Total time: {elapsed/3600:.1f} hours")
        print(f"📈 Average rate: {self.processed_count/(elapsed/3600):.1f} sermons/hour")

        if self.errors:
            print(f"\n❌ Errors ({len(self.errors)}):")
            for error in self.errors:
                print(f"  • {error}")

        if self.completed_sermons:
            print(f"\n✅ Completed files ({len(self.completed_sermons)}):")
            for filename in self.completed_sermons:
                print(f"  ✅ {filename}")

def main():
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    print("🚀 Starting WORKING transcription system")

    with WorkingTranscriptionProcessor() as processor:
        processor.process_all_sermons()

if __name__ == "__main__":
    main()