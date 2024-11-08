const magic8BallResponses = [
  'It is decidedly so',
  'Without a doubt',
  'You may rely on it',
  'Most likely',
  'Outlook good',
  'Signs point to yes',
  'Reply hazy, try again',
  'Ask again later',
  'Better not tell you now',
  'Cannot predict now',
  'Concentrate and ask again',
  "Don't count on it",
  'My sources say no',
  'Outlook not so good',
  'Very doubtful',
  'Impossible'
]

export function askThe8Ball () {
  return magic8BallResponses[Math.floor(Math.random() * magic8BallResponses.length)]
}
