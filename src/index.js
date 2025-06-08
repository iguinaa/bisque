import Discord, { GatewayIntentBits, AttachmentBuilder } from 'discord.js'
import 'dotenv/config'
import * as MagicEightBall from './features/8ball.js'
import * as Meme from './features/hot-memes/hot-memes.js'
import * as VoiceJoinNoise from './features/voice-join-noise/voice-join-noise.js'

/* Remember to delete this intent shit, didn't realize it was baked into discord.js, could be good learning for max though. */
// eslint-disable-next-line
import { Intent, addIntent, getIntentNumber } from './depends/discord/intents.js' // Intents = Collection of events to subscribe to

addIntent(Intent.GUILDS)
addIntent(Intent.GUILD_MESSAGES)
/* End intent shit */

const discordClient = new Discord.Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ] 
})

discordClient.on('ready', () => {  console.log(`Testing... Login is: ${discordClient.user.tag}`)
  
  // Initialize voice join noise feature
  VoiceJoinNoise.initializeVoiceJoinNoise(discordClient)
})

discordClient.on('messageCreate', async message => {
  if (!message.content.startsWith('!') || message.author.bot) {
    console.log('ignoring message...')
    return
  }
  const command = message.content.split(' ')

  let response = ''
  switch (command[0]) {
    case '!ping':
      await message.reply('pong')
      break
    case '!magic8':
      response = MagicEightBall.askThe8Ball()
      await message.reply(response)
      break
    case '!meme':
      try {
        const meme = await Meme.getHotMeme()
        const discordedMeme = new AttachmentBuilder(meme.imageData, { name: `meme.${meme.extension}` })
        await message.channel.send({ files: [discordedMeme] })      } catch {
        await message.reply('Sorry, failed to fetch dank memes. Check error log for deetz.')
      }
      break
    case '!voice':      if (command[1] === 'status') {
        const status = VoiceJoinNoise.getVoiceStatus()
        await message.reply(`Voice Join Noise Status:\nActive connections: ${status.activeConnections}\nTracked channels: ${status.trackedChannels}\nActive cooldowns: ${status.activeCooldowns}`)
      } else if (command[1] === 'test' && message.member.voice.channel) {
        await VoiceJoinNoise.testSound(message.member.voice.channel)
        await message.reply('Testing voice join noise sound!')
      } else {
        await message.reply('Voice commands: `!voice status` - Check voice join noise status, `!voice test` - Test sound (must be in voice channel)')
      }
      break
  }

  console.log('replying...')
})

// discordClient.on('message', async (message) => {
//   console.log("are we here?")
//   await message.reply("pong")
// })

// discordClient.on('interactionCreate', async interaction => {
//   console.log("what up")
//   if (interaction.commandName === 'ping') {
//     await interaction.reply('pong!')
//   }
// })

discordClient.login()
