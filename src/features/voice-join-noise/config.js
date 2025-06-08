// Voice Join Noise Configuration
// Modify these settings to customize the voice join noise behavior
//
// Current behavior: 
// - Plays sound for EVERY new user that joins a voice channel
// - Uses debouncing to prevent overlapping sounds when multiple users join quickly
// - Automatically unmutes the bot when joining voice channels

export const config = {
  // Path to the sound file to play when someone joins
  // Supported formats: MP3, WAV, OGG
  soundFilePath: 'assets/sounds/wow.mp3',
  
  // Delay before leaving an empty channel (in milliseconds)
  // Set to 0 for immediate leave, or higher value to prevent rapid join/leave cycles
  emptyChannelDelay: 0,
  
  // Whether to play sound for every new user or just the second user
  playForEveryUser: true,
  
  // Debounce delay to prevent overlapping sounds (milliseconds)
  // If multiple users join within this timeframe, only one sound plays
  soundDebounceDelay: 4000,
  
  // Volume level for joining sound (0.0 to 1.0, where 1.0 is full volume)
  soundVolume: 0.5,
  
  // Maximum number of users before stopping sound playback
  // Set to 0 for no limit
  maxUsersForSound: 0,
  
  // Enable debug logging
  debugMode: true
}
