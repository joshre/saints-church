#!/usr/bin/env python3
"""
Saints Church Sermon Transcription
Uses whisper.cpp (Metal GPU acceleration) for fast, reliable transcription
Automatically formats descriptions to markdown
"""

import os
import re
import sys
import json
import tempfile
import requests
import subprocess
import time
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

# Import description formatter
from utils import format_description

# ESV API configuration
ESV_API_URL = "https://api.esv.org/v3/passage/text/"
ESV_API_KEY = os.environ.get("ESV_API_KEY", "")

# Whisper.cpp configuration
WHISPER_CLI = "/opt/homebrew/bin/whisper-cli"
WHISPER_MODEL = "/opt/homebrew/share/whisper-cpp/ggml-large-v3-q5_0.bin"

@dataclass
class SermonFile:
    filepath: str
    filename: str
    date: str
    title: str
    audio_url: str
    content: str
    frontmatter: Dict

class WhisperCppTranscriptionProcessor:
    def __init__(self):
        self.temp_dir = Path(tempfile.mkdtemp(prefix="sermon_audio_"))
        self.processed_count = 0
        self.total_count = 0
        self.errors = []
        self.completed_sermons = []
        self.start_time = time.time()
        self.esv_cache = {}

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def fetch_esv_scripture(self, scripture_ref: str) -> Optional[str]:
        """Fetch ESV scripture text for a given reference"""
        if not scripture_ref or not scripture_ref.strip():
            return None

        if scripture_ref in self.esv_cache:
            return self.esv_cache[scripture_ref]

        try:
            headers = {}
            if ESV_API_KEY:
                headers["Authorization"] = f"Token {ESV_API_KEY}"

            params = {
                "q": scripture_ref,
                "include-headings": False,
                "include-footnotes": False,
                "include-verse-numbers": True,
                "include-short-copyright": False,
                "include-passage-references": False
            }

            response = requests.get(
                ESV_API_URL,
                params=params,
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                passages = data.get("passages", [])
                if passages:
                    text = passages[0].strip()
                    self.esv_cache[scripture_ref] = text
                    print(f"📖 Fetched ESV text for {scripture_ref} ({len(text)} chars)")
                    return text
            else:
                print(f"⚠️  ESV API returned status {response.status_code} for {scripture_ref}")
                return None

        except Exception as e:
            print(f"⚠️  Failed to fetch ESV text for {scripture_ref}: {e}")
            return None

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
        """Transcribe with whisper.cpp (Metal GPU acceleration)"""
        try:
            print(f"🎤 [{self.processed_count + 1}/{self.total_count}] Transcribing: {sermon.title}")
            print(f"⚡ Using whisper.cpp with Metal GPU acceleration...")

            # Convert M4A to WAV for whisper.cpp compatibility
            wav_file = audio_file.with_suffix('.wav')
            if audio_file.suffix.lower() in ['.m4a', '.aac']:
                print(f"🔄 Converting {audio_file.suffix} to WAV...")
                convert_cmd = ["ffmpeg", "-i", str(audio_file), "-ar", "16000", "-ac", "1", "-y", str(wav_file)]
                result = subprocess.run(convert_cmd, capture_output=True, text=True, timeout=300)
                if result.returncode != 0:
                    raise Exception(f"ffmpeg conversion failed: {result.stderr}")
                audio_file.unlink()  # Remove original M4A
                audio_file = wav_file

            # Build contextual prompt
            prompt_parts = [f"This is a sermon by Pastor Nate Ellis on {sermon.title}."]

            # Add scripture text if available
            scripture_ref = sermon.frontmatter.get('scripture', '')
            if scripture_ref:
                esv_text = self.fetch_esv_scripture(scripture_ref)
                if esv_text:
                    # Include first 500 chars of scripture
                    scripture_sample = esv_text[:500]
                    prompt_parts.append(f"Scripture passage ({scripture_ref}): {scripture_sample}")

            # Add sermon description
            description = sermon.frontmatter.get('description', '')
            if description:
                import html
                clean_description = re.sub(r'<[^>]+>', '', html.unescape(description))
                prompt_parts.append(clean_description[:200])

            initial_prompt = " ".join(prompt_parts)

            # Create output path for JSON
            output_json = self.temp_dir / f"{sermon.date}_transcript.json"

            # Call whisper-cli
            cmd = [
                WHISPER_CLI,
                "-m", WHISPER_MODEL,
                "-l", "en",
                "--prompt", initial_prompt,
                "-ojf",  # Output JSON full
                "-of", str(output_json.with_suffix('')),  # Output file (without extension)
                str(audio_file)
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=3600  # 1 hour max
            )

            if result.returncode != 0:
                raise Exception(f"whisper-cli failed: {result.stderr}")

            # Read JSON output
            json_file = output_json
            if not json_file.exists():
                raise Exception(f"Expected output file not found: {json_file}")

            with open(json_file, 'r', encoding='utf-8') as f:
                whisper_output = json.load(f)

            # Extract full transcript from segments
            segments = whisper_output.get('transcription', [])
            if not segments:
                raise Exception("No transcription segments in output")

            # Combine all segment texts
            transcript_parts = []
            for segment in segments:
                text = segment.get('text', '').strip()
                if text:
                    transcript_parts.append(text)

            transcription = ' '.join(transcript_parts)

            # Basic cleanup - add paragraph breaks
            transcription = re.sub(r'\s+', ' ', transcription)
            transcription = re.sub(r'([.!?])\s*([A-Z])', r'\1\n\n\2', transcription)

            print(f"✅ Transcribed: {len(transcription):,} characters")

            # Cleanup JSON file
            json_file.unlink(missing_ok=True)

            return transcription

        except subprocess.TimeoutExpired:
            error_msg = f"Transcription timeout for {sermon.title}"
            print(f"❌ {error_msg}")
            self.errors.append(error_msg)
            return None
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
            new_content += f"transcription_model: whisper-cpp-large-v3-q5\n"
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
        print("🔧 Saints Church Transcription System")
        print("=" * 60)
        print("⚡ Using whisper.cpp with Metal GPU acceleration")
        print("📦 Model: large-v3 Q5 quantized (1.0GB)")
        print("🚀 Expected: 4-9 minutes per sermon")
        print("=" * 60)

        sermons = self.get_all_sermons()
        if not sermons:
            print("✅ No sermons need transcription!")
            return

        self.total_count = len(sermons)
        self.start_time = time.time()

        print(f"\n📊 Processing {len(sermons)} sermons")
        print(f"⏱️  Estimated time: {len(sermons) * 7 / 60:.1f} hours (avg 7 min/sermon)")
        print()

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
    # Check dependencies
    if not Path(WHISPER_CLI).exists():
        print(f"❌ whisper-cli not found at {WHISPER_CLI}")
        print("Install: brew install whisper-cpp")
        sys.exit(1)

    if not Path(WHISPER_MODEL).exists():
        print(f"❌ Model not found at {WHISPER_MODEL}")
        print("Download: brew install whisper-cpp")
        sys.exit(1)

    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    print("🚀 Starting whisper.cpp transcription system")

    with WhisperCppTranscriptionProcessor() as processor:
        processor.process_all_sermons()

if __name__ == "__main__":
    main()
