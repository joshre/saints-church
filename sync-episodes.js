          const Parser = require('rss-parser');
          const fs = require('fs');
          const path = require('path');
          const crypto = require('crypto');

          const parser = new Parser({
            customFields: {
              item: [
                'guid',
                'enclosure',
                'itunes:duration',
                'itunes:author',
                'itunes:summary'
              ]
            }
          });

          const RSS_URL = 'https://anchor.fm/s/f5d78a70/podcast/rss';
          const PROCESSED_FILE = '_data/processed_episodes.json';
          const POSTS_DIR = '_posts';

          // Constants
          const NETWORK_TIMEOUT = 30000;
          const CONTENT_HASH_LENGTH = 16;
          const EPISODE_HASH_LENGTH = 8;
          const DEFAULT_PASTOR = 'Pastor Nate Ellis';
          const MAX_FILENAME_LENGTH = 100;

          // Load processed episodes
          function loadProcessedEpisodes() {
            try {
              if (fs.existsSync(PROCESSED_FILE)) {
                const data = fs.readFileSync(PROCESSED_FILE, 'utf8');
                return JSON.parse(data);
              }
            } catch (error) {
              console.log('Error loading processed episodes:', error.message);
            }
            return [];
          }

          // Save processed episodes
          function saveProcessedEpisodes(episodes) {
            try {
              fs.writeFileSync(PROCESSED_FILE, JSON.stringify(episodes, null, 2));
              console.log(`Saved ${episodes.length} processed episodes to tracking file`);
            } catch (error) {
              console.error('Error saving processed episodes:', error.message);
            }
          }

          // Generate content hash for change detection
          function generateContentHash(episode) {
            const contentToHash = [
              episode.title,
              episode.description || episode['itunes:summary'] || '',
              episode.enclosure?.url || '',
              episode['itunes:duration'] || '',
              episode['itunes:author'] || ''
            ].join('|');
            return crypto.createHash('sha256').update(contentToHash).digest('hex').substring(0, CONTENT_HASH_LENGTH);
          }

          // Extract scripture references from title or description
          function extractScripture(text) {
            if (!text) return null;

            // Common Bible book patterns - enhanced for Reformed Baptist context
            const patterns = [
              // Full book names with comprehensive verse patterns
              /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Songs|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+\d+(?::\d+(?:[-–]\d+)?)?(?:[-–]\d+:\d+)?\b/gi,

              // Abbreviated forms (common in Reformed circles)
              /\b(?:Gen|Ex|Exod|Lev|Num|Deut|Josh|Judg|1Sam|2Sam|1Kgs|2Kgs|1Chr|2Chr|Ezr|Neh|Est|Ps|Prov|Eccl|Song|Isa|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|Jonah|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt|Mk|Lk|Jn|Acts|Rom|1Cor|2Cor|Gal|Eph|Phil|Col|1Thess|2Thess|1Tim|2Tim|Tit|Phlm|Heb|Jas|1Pet|2Pet|1Jn|2Jn|3Jn|Jude|Rev)\.?\s+\d+(?::\d+(?:[-–]\d+)?)?(?:[-–]\d+:\d+)?\b/gi,

              // Roman numeral books
              /\b(?:I|II|III|IV)\s+(?:Samuel|Kings|Chronicles|Corinthians|Thessalonians|Timothy|Peter|John)\s+\d+(?::\d+(?:[-–]\d+)?)?(?:[-–]\d+:\d+)?\b/gi,

              // Single chapter books
              /\b(?:Obadiah|Philemon|2 John|3 John|Jude)\s*(?:v\.?\s*\d+(?:[-–]\d+)?)?\b/gi
            ];

            for (const pattern of patterns) {
              const match = text.match(pattern);
              if (match) {
                // Clean up the reference
                let reference = match[0].trim();
                // Standardize em-dashes and en-dashes to hyphens
                reference = reference.replace(/[–—]/g, '-');
                return reference;
              }
            }

            return null;
          }

          // Calculate the Sunday on or before the given date (sermon date)
          function getSermonSunday(date) {
            const day = new Date(date);
            const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, etc.

            // If it's already Sunday (0), use that date
            // Otherwise, go back to the previous Sunday
            const daysToSubtract = dayOfWeek;
            const sermonDate = new Date(day);
            sermonDate.setDate(day.getDate() - daysToSubtract);

            return sermonDate;
          }

          // Parse duration from various formats
          function parseDuration(duration) {
            if (!duration || typeof duration !== 'string') return null;

            // Handle MM:SS or HH:MM:SS format
            const parts = duration.split(':').map(p => parseInt(p, 10));

            // Validate that all parts are valid numbers
            if (parts.some(p => isNaN(p))) {
              return null;
            }

            if (parts.length === 2) {
              // MM:SS
              const [minutes, seconds] = parts;
              return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else if (parts.length === 3) {
              // HH:MM:SS
              const [hours, minutes, seconds] = parts;
              if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
              } else {
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
              }
            }

            return duration;
          }

          // Generate Jekyll filename from date and title
          function generateFilename(date, title) {
            const dateStr = date.toISOString().split('T')[0];
            let slug = title
              .toLowerCase()
              .replace(/[^\w\s-]/g, '') // Remove special characters
              .replace(/\s+/g, '-') // Replace spaces with hyphens
              .replace(/-+/g, '-') // Replace multiple hyphens with single
              .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
              .substring(0, MAX_FILENAME_LENGTH); // Limit length to prevent filesystem issues

            // Ensure slug is not empty
            if (!slug) {
              slug = 'untitled-sermon';
            }

            return `${dateStr}-${slug}.md`;
          }


          // Generate frontmatter and content for Jekyll post
          function generatePost(episode, existingContent = null) {
            const pubDate = new Date(episode.pubDate);
            const sermonDate = getSermonSunday(pubDate); // Use sermon Sunday instead of publish date
            const scripture = extractScripture(episode.title) || extractScripture(episode.description);
            const duration = parseDuration(episode['itunes:duration']);

            // Extract series from title with Reformed Baptist context
            let series = null;

            // Method 1: Look for patterns like "Series Name: Episode Title"
            const seriesMatch = episode.title.match(/^([^:]+):\s*(.+)$/);
            if (seriesMatch) {
              const potentialSeries = seriesMatch[1].trim();
              // Only treat as series if it's not a scripture reference
              if (!extractScripture(potentialSeries)) {
                series = potentialSeries;
              }
            }

            // Method 2: Detect common biblical book series for expository preaching
            if (!series && scripture) {
              const bookMatch = scripture.match(/^(.*?)\s+\d+/);
              if (bookMatch) {
                const book = bookMatch[1].trim();
                // Common series names for expository preaching through books
                if (['John', 'Galatians', 'Romans', 'Ephesians', 'Matthew', 'Mark', 'Luke', 'Acts', 'Genesis', 'Exodus'].includes(book)) {
                  series = book;
                }
              }
            }

            // Generate unique hash for audio player progress tracking
            const episodeHash = crypto.createHash('sha256').update(episode.guid || episode.link || episode.title).digest('hex').substring(0, EPISODE_HASH_LENGTH);

            const frontmatter = {
              layout: 'sermon',
              title: episode.title,
              date: sermonDate.toISOString(),
              category: 'sermon',
              audio_url: episode.enclosure?.url || null,
              duration: duration,
              scripture: scripture,
              series: series,
              pastor: DEFAULT_PASTOR,
              description: episode.description || episode['itunes:summary'] || null,
              guid: episode.guid,
              episode_id: episodeHash
            };

            // Remove null values
            Object.keys(frontmatter).forEach(key => {
              if (frontmatter[key] === null) {
                delete frontmatter[key];
              }
            });

            let content = '---\n';
            Object.entries(frontmatter).forEach(([key, value]) => {
              if (typeof value === 'string') {
                // Escape YAML special characters and wrap in quotes
                const escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
                content += `${key}: "${escapedValue}"\n`;
              } else {
                content += `${key}: ${value}\n`;
              }
            });
            content += '---\n\n';

            // Preserve existing transcription content if it exists
            if (existingContent) {
              // Robust content preservation with multiple fallback patterns
              const preservationPatterns = [
                // Standard frontmatter with double newline
                /^---[\s\S]*?---\r?\n\r?\n([\s\S]*)$/,
                // Frontmatter with single newline (malformed but common)
                /^---[\s\S]*?---\r?\n([\s\S]*)$/,
                // Frontmatter with extra whitespace
                /^---[\s\S]*?---\s+([\s\S]*)$/
              ];

              for (const pattern of preservationPatterns) {
                const existingBodyMatch = existingContent.match(pattern);
                if (existingBodyMatch && existingBodyMatch[1].trim()) {
                  // Keep existing body content (transcriptions)
                  console.log(`Preserved ${existingBodyMatch[1].trim().length} characters of existing content`);
                  content += existingBodyMatch[1];
                  return content;
                }
              }

              // If no pattern matches but content exists, log warning
              if (existingContent.trim()) {
                console.warn('Could not parse existing frontmatter to preserve content');
              }
            }

            // Add episode content only for new files (avoid duplication)
            if (episode.content || episode['itunes:summary']) {
              const episodeContent = episode.content || episode['itunes:summary'];
              const description = episode.description || '';

              // Only add if content is meaningfully different (not just whitespace/formatting)
              const normalizeText = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
              if (normalizeText(episodeContent) !== normalizeText(description) && episodeContent.length > 50) {
                // Escape YAML content properly
                const escapedContent = episodeContent.replace(/\\/g, '\\\\').replace(/---/g, '\\-\\-\\-');
                content += `${escapedContent}\n`;
              }
            }

            return content;
          }

          async function syncEpisodes() {
            try {
              console.log(`Fetching RSS feed from: ${RSS_URL}`);

              // Create parser with timeout
              const feedPromise = parser.parseURL(RSS_URL);
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`RSS feed fetch timeout after ${NETWORK_TIMEOUT / 1000} seconds`)), NETWORK_TIMEOUT)
              );

              const feed = await Promise.race([feedPromise, timeoutPromise]);
              console.log(`Found ${feed.items.length} episodes in RSS feed`);

              const processedEpisodes = loadProcessedEpisodes();
              // Build map efficiently without intermediate array
              const processedMap = processedEpisodes.reduce((map, ep) => {
                map.set(ep.guid, ep);
                return map;
              }, new Map());

              let newEpisodes = 0;
              let updatedEpisodes = 0;

              for (const item of feed.items) {
                // Validate required fields
                if (!item.title || typeof item.title !== 'string' || !item.title.trim()) {
                  console.log('Skipping episode with missing or invalid title');
                  continue;
                }

                const guid = item.guid || item.link;
                if (!guid) {
                  console.log(`Skipping episode "${item.title}" with missing GUID and link`);
                  continue;
                }

                const currentContentHash = generateContentHash(item);
                const existingEpisode = processedMap.get(guid);

                if (existingEpisode) {
                  // Check if content has changed
                  if (existingEpisode.content_hash && existingEpisode.content_hash === currentContentHash) {
                    console.log(`No changes for episode: ${item.title}`);
                    continue;
                  } else {
                    console.log(`Content updated for episode: ${item.title}`);
                  }
                } else {
                  console.log(`Processing new episode: ${item.title}`);
                }

                try {
                  const pubDate = new Date(item.pubDate);
                  if (isNaN(pubDate.getTime())) {
                    throw new Error(`Invalid publication date: ${item.pubDate}`);
                  }

                  const sermonDate = getSermonSunday(pubDate);
                  const filename = generateFilename(sermonDate, item.title);

                  // Log date adjustment if sermon date differs from publish date
                  if (sermonDate.toDateString() !== pubDate.toDateString()) {
                    console.log(`Adjusted sermon date: ${item.title} - Published: ${pubDate.toDateString()}, Sermon: ${sermonDate.toDateString()}`);
                  }
                  if (!filename || filename.endsWith('-.md')) {
                    throw new Error(`Invalid filename generated from title: ${item.title}`);
                  }

                  // Prevent path traversal attacks
                  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                    throw new Error(`Unsafe filename detected: ${filename}`);
                  }

                  const filepath = path.join(POSTS_DIR, filename);

                  // Read existing content to preserve transcriptions
                  let existingContent = null;
                  if (existingEpisode) {
                    // Try to read from the existing file location (in case filename changed)
                    const existingFilepath = existingEpisode.filename ?
                      path.join(POSTS_DIR, existingEpisode.filename) :
                      filepath;

                    if (fs.existsSync(existingFilepath)) {
                      try {
                        existingContent = fs.readFileSync(existingFilepath, 'utf8');
                        console.log(`Preserving content from: ${existingEpisode.filename || filename}`);
                      } catch (error) {
                        console.warn(`Could not read existing file ${existingFilepath}: ${error.message}`);
                      }
                    }
                  }

                  const postContent = generatePost(item, existingContent);

                  // Atomic operation: write new file first, then delete old if needed
                  fs.writeFileSync(filepath, postContent, { mode: 0o644 });

                  // If this is an update and filename has changed, delete the old file after successful write
                  if (existingEpisode && existingEpisode.filename && existingEpisode.filename !== filename) {
                    const oldFilepath = path.join(POSTS_DIR, existingEpisode.filename);
                    if (fs.existsSync(oldFilepath)) {
                      fs.unlinkSync(oldFilepath);
                      console.log(`Deleted old file: ${existingEpisode.filename}`);
                    }
                  }

                  console.log(`${existingEpisode ? 'Updated' : 'Created'} post: ${filename}`);

                  // Increment counters only after successful processing
                  if (existingEpisode) {
                    updatedEpisodes++;
                  } else {
                    newEpisodes++;
                  }

                  // Update or add to processed episodes
                  const episodeRecord = {
                    guid: guid,
                    title: item.title,
                    filename: filename,
                    content_hash: currentContentHash,
                    processed_at: new Date().toISOString()
                  };

                  // Update the map for future lookups
                  processedMap.set(guid, episodeRecord);
                } catch (error) {
                  console.error(`Error processing episode "${item.title}":`, error.message);
                }
              }

              // Rebuild array from map for saving (maintains all episodes)
              const finalProcessedEpisodes = Array.from(processedMap.values());
              saveProcessedEpisodes(finalProcessedEpisodes);

              console.log(`\nSync complete: ${newEpisodes} new episodes, ${updatedEpisodes} updated episodes processed`);
              console.log(`Total episodes in feed: ${feed.items.length}`);
              console.log(`Total processed episodes: ${finalProcessedEpisodes.length}`);

              // Set output for GitHub Actions
              if (process.env.GITHUB_OUTPUT) {
                fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_episodes=${newEpisodes}\n`);
                fs.appendFileSync(process.env.GITHUB_OUTPUT, `total_episodes=${feed.items.length}\n`);
              }
            } catch (error) {
              console.error('Error syncing episodes:', error.message);
              process.exit(1);
            }
          }

          // Run the sync
          syncEpisodes();
