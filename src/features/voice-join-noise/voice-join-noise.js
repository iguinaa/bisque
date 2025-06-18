import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } from '@discordjs/voice'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get sound file path from config, with fallback to default
const SOUND_FILE_PATH = join(process.cwd(), config.soundFilePath)

// Track active voice connections and sound debounce timers
const activeConnections = new Map()
const soundCooldowns = new Map()

export function initializeVoiceJoinNoise(client) {
  if (!config.enabled) {
    console.log('Voice Join Noise is disabled in config')
    return
  }
  
  client.on('voiceStateUpdate', handleVoiceStateUpdate)
  console.log('Voice Join Noise initialized!')
  
  // Periodic cleanup to prevent getting stuck in empty channels
  setInterval(() => {
    cleanupEmptyChannels()
  }, 5 * 60 * 1000) // Every 5 minutes
}

export function getVoiceStatus() {
  if (!config.enabled) {
    return {
      enabled: false,
      activeConnections: 0,
      activeCooldowns: 0
    }
  }
  
  return {
    enabled: true,
    activeConnections: activeConnections.size,
    activeCooldowns: soundCooldowns.size
  }
}

export async function testSound(channel) {
  if (!config.enabled) {
    throw new Error('Voice Join Noise feature is disabled in configuration')
  }
  
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
    await playJoiningSoundWithDebounce(channel, { displayName: 'Test User' })
    return
  }
  
  // Temporarily join channel to test sound
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfMute: false,
    selfDeaf: true,
  })
  
  try {
    await playJoiningSoundWithDebounce(channel, { displayName: 'Test User' })
    
    // Count current human users in the channel
    const humanUsers = channel.members.filter(member => !member.user.bot)
    
    if (humanUsers.size > 0) {
      // Users are present, keep the connection active
      activeConnections.set(channel.id, connection)
      setupConnectionEvents(connection, channel)
      
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
  if (config.debugMode) {
    console.log(`User ${member.displayName} joined voice channel: ${channel.name}`)
  }
  
  // Count current human users in the channel (including the one who just joined)
  const humanUsers = channel.members.filter(member => !member.user.bot)
  const userCount = humanUsers.size
  
  if (config.debugMode) {
    console.log(`Channel ${channel.name} now has ${userCount} users`)
  }
  
  // If this is the first user, bot should join
  if (userCount === 1) {
    await joinBotToChannel(channel)
  }
  // For any user after the first, play sound (if bot is connected)
  else if (userCount >= 2 && activeConnections.has(channel.id)) {
    await playJoiningSoundWithDebounce(channel, member)
  }
}

async function handleUserLeftChannel(channel, member) {
  if (config.debugMode) {
    console.log(`User ${member.displayName} left voice channel: ${channel.name}`)
  }
  
  // Check if we should leave the channel
  await checkIfShouldLeaveChannel(channel)
}

async function checkIfShouldLeaveChannel(channel) {
  // Only check if we're actually in this channel
  if (!activeConnections.has(channel.id)) return
  
  // Count current human users in the channel
  const humanUsers = channel.members.filter(member => !member.user.bot)
  const userCount = humanUsers.size
  
  if (config.debugMode) {
    console.log(`Channel ${channel.name} now has ${userCount} users`)
  }
  
  // If channel is empty, leave
  if (userCount === 0) {
    // Clear any pending sound cooldown
    if (soundCooldowns.has(channel.id)) {
      clearTimeout(soundCooldowns.get(channel.id))
      soundCooldowns.delete(channel.id)
    }
    
    if (config.emptyChannelDelay > 0) {
      // Wait before leaving to prevent rapid join/leave cycles
      setTimeout(async () => {
        // Double-check if channel is still empty after delay
        const currentUsers = channel.members.filter(member => !member.user.bot)
        if (currentUsers.size === 0) {
          await leaveBotFromChannel(channel)
        }
      }, config.emptyChannelDelay)
    } else {
      await leaveBotFromChannel(channel)
    }
  }
}

async function joinBotToChannel(channel) {
  try {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfMute: false,
      selfDeaf: true,
    })
    
    activeConnections.set(channel.id, connection)
    setupConnectionEvents(connection, channel)
    
    console.log(`Bot joined voice channel: ${channel.name}`)
  } catch (error) {
    console.error('Failed to join voice channel:', error)
  }
}

function setupConnectionEvents(connection, channel) {
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
}

async function leaveBotFromChannel(channel) {
  const connection = activeConnections.get(channel.id)
  if (connection) {
    try {
      if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
        connection.destroy()
      }
    } catch (error) {
      console.warn(`Warning: Issue destroying voice connection for ${channel.name}:`, error.message)
    } finally {
      activeConnections.delete(channel.id)
      console.log(`Bot left voice channel: ${channel.name}`)
    }
  }
}

// Periodic cleanup function to handle missed events
async function cleanupEmptyChannels() {
  if (config.debugMode) {
    console.log(`Running periodic cleanup check for ${activeConnections.size} active connections`)
  }
  
  for (const [channelId, connection] of activeConnections) {
    try {
      // Get the channel from the connection's guild
      const guild = connection.joinConfig.guildId
      const client = connection._state?.adapter?.client || connection.joinConfig.adapterCreator().client
      
      if (!client) continue
      
      const channel = await client.channels.fetch(channelId)
      if (channel) {
        await checkIfShouldLeaveChannel(channel)
      } else {
        // Channel no longer exists, clean up connection
        if (config.debugMode) {
          console.log(`Cleaning up connection for deleted channel: ${channelId}`)
        }
        connection.destroy()
        activeConnections.delete(channelId)
      }
    } catch (error) {
      if (config.debugMode) {
        console.warn(`Cleanup error for channel ${channelId}:`, error.message)
      }
      // If we can't check the channel, just clean up the connection
      try {
        connection.destroy()
      } catch (destroyError) {
        // Ignore destroy errors during cleanup
      }
      activeConnections.delete(channelId)
    }
  }
}

async function playJoiningSound(channel, member) {
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
      console.log('For now, simulating joining sound...')
      
      if (config.debugMode) {
        console.log(`🎵 [SIMULATED] Playing joining sound for ${member ? member.displayName : 'user'} in channel: ${channel.name}`)
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
      console.log(`🎵 Playing joining sound for ${member ? member.displayName : 'user'} in channel: ${channel.name}`)
    }
    
    // Clean up after playing
    player.on(AudioPlayerStatus.Idle, () => {
      player.stop()
    })
    
    player.on('error', error => {
      console.error('Audio player error:', error)
    })
    
  } catch (error) {
    console.error('Failed to play joining sound:', error)
    console.log('Make sure you have a valid audio file at:', SOUND_FILE_PATH)
    console.log('FFmpeg must be installed for audio processing')
  }
}

async function playJoiningSoundWithDebounce(channel, member) {
  const channelId = channel.id
  
  // Check if there's already a sound cooldown for this channel
  if (soundCooldowns.has(channelId)) {
    if (config.debugMode) {
      console.log(`Sound debounced for ${member.displayName} in channel: ${channel.name}`)
    }
    return // Skip playing sound, we're in cooldown period
  }
  
  // Play the sound immediately
  await playJoiningSound(channel, member)
  
  // Set cooldown to prevent overlapping sounds
  const cooldownTimer = setTimeout(() => {
    soundCooldowns.delete(channelId)
    if (config.debugMode) {
      console.log(`Sound cooldown cleared for channel: ${channel.name}`)
    }
  }, config.soundDebounceDelay)
  
  soundCooldowns.set(channelId, cooldownTimer)
}
