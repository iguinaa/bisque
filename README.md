# Bisque Discord Bot

A Discord bot with meme fetching, magic 8-ball, and voice channel greeting features.

## Features

### 🎱 Magic 8-Ball
- `!magic8` - Get a random magic 8-ball response

### 🔥 Hot Memes
- `!meme` - Fetch a random hot meme from Reddit

### 🎵 Voice Greeter (NEW!)
- Automatically joins voice channels when users enter
- Plays a customizable sound for every new user that joins
- Smart debouncing prevents overlapping sounds when multiple users join quickly
- Leaves when the channel becomes empty
- `!voice status` - Check voice greeter status
- `!voice test` - Test the greeting sound

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   - Copy `.env.example` to `.env`
   - Add your Discord bot token
   - Add Reddit API credentials (for memes)

3. **Set up voice greeter** (optional):
   
   **Install FFmpeg** (required for audio processing):
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian  
   sudo apt install ffmpeg
   
   # Windows - Download from https://ffmpeg.org/download.html
   ```
   
   **Add a sound file**:
   - Find a "wow" sound effect (try freesound.org)
   - Convert to MP3 format if needed (keep it 1-3 seconds, under 1MB)
   - Save as: `assets/sounds/wow.mp3`
   - **Important**: Ensure you have proper rights to use the sound file!

4. **Start the bot**:
   ```bash
   npm start
   ```

## Bot Permissions Required

- Send Messages
- Read Message History
- Connect (voice)
- Speak (voice)
- Use Voice Activity

## Configuration

### Voice Greeter
Edit `src/features/voice-greeter-config.js` to customize:
- Sound file path
- Playback behavior
- Debug settings

See `src/features/voice-greeter-README.md` for detailed documentation.

## Commands

| Command | Description |
|---------|-------------|
| `!ping` | Simple ping/pong test |
| `!magic8` | Magic 8-ball response |
| `!meme` | Random hot meme from Reddit |
| `!voice status` | Voice greeter status |
| `!voice test` | Test voice greeting sound |

## Development

- Uses Discord.js v14
- ES6 modules
- Standard.js linting

```bash
npm run lint      # Check code style
npm run lint-fix  # Auto-fix style issues
```
