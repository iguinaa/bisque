import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } from '@discordjs/voice'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from './voice-greeter-config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get sound file path from config, with fallback to default
const SOUND_FILE_PATH = join(process.cwd(), config.soundFilePath)

// Track active voice connections and channel states
const activeConnections = new Map()
const channelStates = new Map()
const soundCooldowns = new Map() // Track sound debounce timers

export function initializeVoiceGreeter(client) {
  client.on('voiceStateUpdate', handleVoiceStateUpdate)
  console.log('Voice Greeter initialized!')
}

export function getVoiceStatus() {
  return {
    activeConnections: activeConnections.size,
    trackedChannels: channelStates.size,
    activeCooldowns: soundCooldowns.size
  }
}

export async function testSound(channel) {
  if (!channel) {
    throw new Error('No voice channel provided')
  }
  
  // Check if bot is already in this channel
  const existingConnection = activeConnections.get(channel.id)
  
  if (existingConnection) {
    // Bot is already in channel, just play the sound
    if (config.debugMode) {
      console.log(`Playing test sound in existing connection for channel: ${channel.name}`)
    }
    await playGreetingSoundWithDebounce(channel, { displayName: 'Test User' })
    return
  }
  
  // Count non-bot users in the channel
  const humanUsers = channel.members.filter(member => !member.user.bot)
  const shouldStayInChannel = humanUsers.size > 0
  
  if (config.debugMode) {
    console.log(`Test: Found ${humanUsers.size} human users in channel ${channel.name}`)
  }
  
  // Temporarily join channel to test sound
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfMute: false, // Unmute so bot can play sounds
    selfDeaf: true,  // Keep deafened since we don't need voice input
  })
  
  try {
    await playGreetingSoundWithDebounce(channel, { displayName: 'Test User' })
    
    if (shouldStayInChannel) {
      // Users are present, add to our tracking and stay
      activeConnections.set(channel.id, connection)
      
      // Initialize channel state if it doesn't exist
      if (!channelStates.has(channel.id)) {
        channelStates.set(channel.id, {
          userCount: humanUsers.size,
          botJoined: true,
          firstUser: humanUsers.first()?.id || null
        })
      }
      
      // Set up the same event handlers as joinBotToChannel
      connection.on(VoiceConnectionStatus.Disconnected, () => {
        if (config.debugMode) {
          console.log(`Voice connection disconnected for channel: ${channel.name}`)
        }
        activeConnections.delete(channel.id)
      })
      
      connection.on(VoiceConnectionStatus.Destroyed, () => {
        if (config.debugMode) {
          console.log(`Voice connection destroyed for channel: ${channel.name}`)
        }
        activeConnections.delete(channel.id)
      })
      
      if (config.debugMode) {
        console.log(`Test: Staying in channel ${channel.name} (${humanUsers.size} users present)`)
      }
    } else {
      // No users present, leave after a short delay
      setTimeout(() => {
        try {
          if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
            connection.destroy()
          }
          if (config.debugMode) {
            console.log(`Test: Left empty channel ${channel.name}`)
          }
        } catch (error) {
          console.warn('Test connection cleanup warning:', error.message)
        }
      }, 3000)
    }
    
  } catch (error) {
    // Clean up connection on error
    try {
      if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
        connection.destroy()
      }
    } catch (cleanupError) {
      console.warn('Test connection cleanup error:', cleanupError.message)
    }
    throw error
  }
}

async function handleVoiceStateUpdate(oldState, newState) {
  const { member, guild } = newState
  
  // Ignore bot users
  if (member.user.bot) return
  
  const oldChannel = oldState.channel
  const newChannel = newState.channel
  
  // User joined a voice channel
  if (!oldChannel && newChannel) {
    await handleUserJoinedChannel(newChannel, member)
  }
  
  // User left a voice channel
  if (oldChannel && !newChannel) {
    await handleUserLeftChannel(oldChannel, member)
  }
  
  // User moved between channels
  if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
    await handleUserLeftChannel(oldChannel, member)
    await handleUserJoinedChannel(newChannel, member)
  }
}

async function handleUserJoinedChannel(channel, member) {
  const channelId = channel.id
  const guildId = channel.guild.id
  
  if (config.debugMode) {
    console.log(`User ${member.displayName} joined voice channel: ${channel.name}`)
  }
  
  // Initialize channel state if it doesn't exist
  if (!channelStates.has(channelId)) {
    channelStates.set(channelId, {
      userCount: 0,
      botJoined: false,
      firstUser: null
    })
  }
  
  const state = channelStates.get(channelId)
  state.userCount++
  
  if (config.debugMode) {
    console.log(`Channel ${channel.name} now has ${state.userCount} users`)
  }
  
  // If this is the first user, bot should join and track them
  if (state.userCount === 1) {
    state.firstUser = member.id
    state.botJoined = true
    await joinBotToChannel(channel)
  }
  // For any user after the first (if bot is in channel), potentially play sound
  else if (state.userCount >= 2 && state.botJoined) {
    // Check if we should play sound based on config and user limits
    const shouldPlaySound = config.playForEveryUser || state.userCount === 2
    const withinUserLimit = config.maxUsersForSound === 0 || state.userCount <= config.maxUsersForSound
    
    if (shouldPlaySound && withinUserLimit) {
      await playGreetingSoundWithDebounce(channel, member)
    }
  }
}

async function handleUserLeftChannel(channel, member) {
  const channelId = channel.id
  const state = channelStates.get(channelId)
  
  if (!state) return
  
  if (config.debugMode) {
    console.log(`User ${member.displayName} left voice channel: ${channel.name}`)
  }
  
  state.userCount--
  
  if (config.debugMode) {
    console.log(`Channel ${channel.name} now has ${state.userCount} users`)
  }
  
  // If channel becomes empty, bot should leave
  if (state.userCount === 0) {
    // Clear any pending sound cooldown
    if (soundCooldowns.has(channelId)) {
      clearTimeout(soundCooldowns.get(channelId))
      soundCooldowns.delete(channelId)
    }
    
    if (config.emptyChannelDelay > 0) {
      // Wait before leaving to prevent rapid join/leave cycles
      setTimeout(async () => {
        // Check if channel is still empty after delay
        const currentState = channelStates.get(channelId)
        if (currentState && currentState.userCount === 0) {
          await leaveBotFromChannel(channel)
          channelStates.delete(channelId)
        }
      }, config.emptyChannelDelay)
    } else {
      await leaveBotFromChannel(channel)
      channelStates.delete(channelId)
    }
  }
}

async function joinBotToChannel(channel) {
  try {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfMute: false, // Unmute so bot can play sounds
      selfDeaf: true,  // Keep deafened since we don't need voice input
    })
    
    activeConnections.set(channel.id, connection)
    
    // Handle connection events
    connection.on(VoiceConnectionStatus.Disconnected, () => {
      if (config.debugMode) {
        console.log(`Voice connection disconnected for channel: ${channel.name}`)
      }
      activeConnections.delete(channel.id)
    })
    
    connection.on(VoiceConnectionStatus.Destroyed, () => {
      if (config.debugMode) {
        console.log(`Voice connection destroyed for channel: ${channel.name}`)
      }
      activeConnections.delete(channel.id)
    })
    
    console.log(`Bot joined voice channel: ${channel.name}`)
  } catch (error) {
    console.error('Failed to join voice channel:', error)
  }
}

async function leaveBotFromChannel(channel) {
  const connection = activeConnections.get(channel.id)
  if (connection) {
    try {
      // Check if connection is still valid before destroying
      if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
        connection.destroy()
      }
    } catch (error) {
      console.warn(`Warning: Issue destroying voice connection for ${channel.name}:`, error.message)
    } finally {
      // Always clean up our tracking regardless of destroy success
      activeConnections.delete(channel.id)
      console.log(`Bot left voice channel: ${channel.name}`)
    }
  }
}

async function playGreetingSound(channel, member) {
  const connection = activeConnections.get(channel.id)
  if (!connection) return
  
  try {
    // Check if sound file exists and is a real audio file
    const fs = await import('fs')
    if (!fs.existsSync(SOUND_FILE_PATH)) {
      console.error(`Sound file not found: ${SOUND_FILE_PATH}`)
      console.log('Please add a valid audio file at this location or update the config.')
      return
    }
    
    // Check if it's actually an audio file (not just a text placeholder)
    const stats = fs.statSync(SOUND_FILE_PATH)
    if (stats.size < 1000) { // Less than 1KB is likely not a real audio file
      console.warn(`⚠️  Sound file appears to be a placeholder (${stats.size} bytes)`)
      console.log('Please replace with a real audio file (MP3, WAV, or OGG)')
      console.log('For now, simulating greeting sound...')
      
      if (config.debugMode) {
        console.log(`🎵 [SIMULATED] Playing greeting sound for ${member ? member.displayName : 'user'} in channel: ${channel.name}`)
      }
      return
    }
    
    // Create audio player and resource with inline volume
    const player = createAudioPlayer()
    const resource = createAudioResource(SOUND_FILE_PATH, {
      inlineVolume: true
    })
    
    // Set volume level from config
    resource.volume.setVolume(config.soundVolume)
    
    // Play the sound
    player.play(resource)
    connection.subscribe(player)
    
    if (config.debugMode) {
      console.log(`🎵 Playing greeting sound for ${member ? member.displayName : 'user'} in channel: ${channel.name}`)
    }
    
    // Clean up after playing
    player.on(AudioPlayerStatus.Idle, () => {
      player.stop()
    })
    
    player.on('error', error => {
      console.error('Audio player error:', error)
    })
    
  } catch (error) {
    console.error('Failed to play greeting sound:', error)
    console.log('Make sure you have a valid audio file at:', SOUND_FILE_PATH)
    console.log('FFmpeg must be installed for audio processing')
  }
}

async function playGreetingSoundWithDebounce(channel, member) {
  const channelId = channel.id
  
  // Check if there's already a sound cooldown for this channel
  if (soundCooldowns.has(channelId)) {
    if (config.debugMode) {
      console.log(`Sound debounced for ${member.displayName} in channel: ${channel.name}`)
    }
    return // Skip playing sound, we're in cooldown period
  }
  
  // Play the sound immediately
  await playGreetingSound(channel, member)
  
  // Set cooldown to prevent overlapping sounds
  const cooldownTimer = setTimeout(() => {
    soundCooldowns.delete(channelId)
    if (config.debugMode) {
      console.log(`Sound cooldown cleared for channel: ${channel.name}`)
    }
  }, config.soundDebounceDelay)
  
  soundCooldowns.set(channelId, cooldownTimer)
}
