import Discord, { GatewayIntentBits } from 'discord.js';
import 'dotenv/config'

/* Remember to delete this intent shit, didn't realize it was baked into discord.js, could be good learning for max though. */
import { Intent, addIntent, getIntentNumber } from './discord/intents.js' // Intents = Collection of events to subscribe to

addIntent(Intent.GUILDS)
addIntent(Intent.GUILD_MESSAGES)
/* End intent shit */

const discordClient = new Discord.Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] })

discordClient.on('ready', () => {
  console.log(`Testing... Login is: ${discordClient.user.tag}`)
})

// discordClient.on('messageCreate', async message => {
//   console.log("are we here?")
//   await message.reply("pong")
// })

// discordClient.on('message', async (message) => {
//   console.log("are we here?")
//   await message.reply("pong")
// })

discordClient.on('interactionCreate', async interaction => {
  console.log("what up")
  if (interaction.commandName === 'ping') {
    await interaction.reply('pong!')
  }
})

discordClient.login()