// Intents List
// https://ziad87.net/intents/ for list of intents and corresponding events
export const Intent = {
  GUILDS: (1 << 0),
  GUILD_MEMBERS: (1 << 1),
  GUILD_BANS: (1 << 2),
  GUILD_EMOJIS_AND_STICKERS: (1 << 3),
  GUILD_INTEGRATIONS: (1 << 4),
  GUILD_WEBHOOKS: (1 << 5),
  GUILD_INVITES: (1 << 6),
  GUILD_VOICE_STATES: (1 << 7),
  GUILD_PRESENCES: (1 << 8),
  GUILD_MESSAGES: (1 << 9),
  GUILD_MESSAGE_REACTIONS: (1 << 10),
  GUILD_MESSAGE_TYPING: (1 << 11),
  DIRECT_MESSAGES: (1 << 12),
  DIRECT_MESSAGE_REACTIONS: (1 << 13),
  DIRECT_MESSAGE_TYPING: (1 << 14),
  MESSAGE_CONTENT: (1 << 15),
  GUILD_SCHEDULED_EVENTS: (1 << 16)
}

const intents = []

export function addIntent (intent) {
  if (!intents.includes(intent)) {
    intents.push(intent)
  }
}

export function getIntentNumber () {
  let result = 0
  // eslint-disable-next-line no-return-assign
  intents.forEach(x => result += x)
  return result
}
