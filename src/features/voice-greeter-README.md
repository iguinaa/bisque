# Voice Greeter Feature

The Voice Greeter automatically joins voice channels and plays a greeting sound when users enter.

## Dependencies

The voice greeter requires these packages to be installed:

```bash
npm install @discordjs/voice @discordjs/opus
```

- `@discordjs/voice` - Core voice functionality  
- `@discordjs/opus` - Audio encoding (required for playing sounds)
- FFmpeg - Audio processing (must be installed on system)

## Setup

1. **Install dependencies**:
```bash
npm install @discordjs/voice @discordjs/opus
```

2. **Install FFmpeg** (required for audio processing):
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian  
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

## How it Works

1. **Auto-join**: When the first user joins any voice channel, the bot automatically joins that channel
2. **Auto-unmute**: The bot automatically unmutes itself when joining (no manual unmuting required!)
3. **Sound trigger**: When a second user (or more, if configured) joins the channel, the bot plays a greeting sound
4. **Auto-leave**: When the voice channel becomes empty, the bot leaves automatically

## Configuration

Edit `src/features/voice-greeter-config.js` to customize behavior:

```javascript
export const config = {
  // Path to sound file (relative to project root)
  soundFilePath: 'assets/sounds/wow.mp3',
  
  // Delay before leaving empty channel (milliseconds)
  emptyChannelDelay: 0,
  
  // Play sound for every new user (not just the second)
  playForEveryUser: true,
  
  // Debounce delay to prevent overlapping sounds (milliseconds)
  soundDebounceDelay: 1500,
  
  // Volume level for greeting sound (0.0 to 1.0, where 1.0 is full volume)
  soundVolume: 0.5,
  
  // Maximum users before stopping sound playback (0 = no limit)
  maxUsersForSound: 10,
  
  // Enable debug logging
  debugMode: true
}
```

## Commands

- `!voice status` - Check how many channels the bot is monitoring
- `!voice test` - Test the greeting sound (you must be in a voice channel)

## Sound File Requirements

- **Supported formats**: MP3, WAV, OGG
- **Recommended duration**: 1-3 seconds
- **File size**: Keep under 1MB for best performance
- **Location**: Place your sound file in `assets/sounds/` directory

## Troubleshooting

### "Sound file not found" error
- Make sure your sound file exists at the configured path
- Check that the file format is supported (MP3, WAV, OGG)
- Verify the file isn't corrupted

### Bot doesn't join voice channels
- Ensure the bot has "Connect" and "Speak" permissions in voice channels
- Check that the `GuildVoiceStates` intent is enabled (already configured)

### No sound plays
- Test with `!voice test` command first
- Check console for error messages
- Verify the sound file is a valid audio format
- Make sure the bot has "Speak" permission in the voice channel

## Debounce Feature

The voice greeter now includes smart debouncing to prevent overlapping sounds:

- **Multiple rapid joins**: If several users join within `soundDebounceDelay` milliseconds, only one sound plays
- **Cooldown tracking**: Each channel has its own cooldown timer
- **Debug visibility**: Use `!voice status` to see active cooldowns
- **Configurable timing**: Adjust `soundDebounceDelay` in the config (default: 1500ms)

This prevents audio chaos when multiple people join a voice channel simultaneously while still greeting every new user individually when they join at different times.

## Example Setup

1. **Find a "wow" sound effect**:
   - Download from freesound.org
   - Search YouTube for "anime wow sound effect" and use a YouTube downloader
   - Use the classic "Owen Wilson wow" sound

2. **Add to project**:
   ```bash
   # Save your sound file as:
   assets/sounds/wow.mp3
   ```

3. **Test it**:
   - Join a voice channel
   - Run `!voice test` in chat
   - The bot should join and play the sound

4. **Try the real feature**:
   - Leave the voice channel (bot should leave too)
   - Join again (bot should join)
   - Have another person join (sound should play!)

## Technical Details

- Uses Discord.js voice library (`@discordjs/voice`)
- Tracks voice state changes with `GuildVoiceStates` intent
- Maintains connection state to avoid unnecessary joins/leaves
- Supports multiple guilds simultaneously
