# Saints Church Scripts

Utility scripts for managing the Saints Church Jekyll site.

## Sermon Transcription

### `transcribe.py`
**Main transcription script** - Processes sermon audio from the podcast RSS feed.

**Features:**
- Uses Whisper Large-V3-Turbo model for fast, accurate transcription
- Automatically formats descriptions from HTML/bullet chars to clean markdown
- Passes sermon context to Whisper for better accuracy
- Tracks progress and provides time estimates

**Usage:**
```bash
cd /path/to/saints-church
python3 scripts/transcribe.py
```

**What it does:**
1. Scans `_posts/` for sermon files without transcriptions
2. Downloads audio from podcast feed
3. Transcribes using Whisper with contextual prompts
4. Formats descriptions to markdown (bullets, line breaks)
5. Adds transcription to sermon file
6. Tags with `transcription_model: whisper-large-v3-turbo`

## Utilities

### `utils.py`
Helper functions for sermon processing.

**Functions:**
- `format_description(description)` - Converts HTML/bullet chars to markdown

## Icon Generation

### `generate-icons.js`
Generates icon sprite sheets from SVG sources.

**Usage:**
```bash
node scripts/generate-icons.js
```

## Requirements

**Python packages:**
```bash
pip3 install openai-whisper requests
```

**For Apple Silicon (M1/M2/M3) optimization:**
```bash
pip3 install torch torchvision torchaudio
```

## Notes

- Transcription requires ~8-10 minutes per sermon with large-v3-turbo
- Scripts automatically format descriptions during transcription
- All sermon data stored in `_posts/` directory
- Audio files temporarily downloaded to `/tmp/` during processing
