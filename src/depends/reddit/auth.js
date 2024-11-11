import Axios from 'axios'

export const userAgent = 'discord-bot:v1.0.0 (by /u/Different-Object8795)'
export const contentType = 'application/x-www-form-urlencoded'

export async function fetchRedditToken () {
  const response = await Axios.post('https://www.reddit.com/api/v1/access_token', 'grant_type=client_credentials', {
    auth: {
      username: process.env.REDDIT_CLIENT_ID,
      password: process.env.REDDIT_CLIENT_SECRET
    },
    headers: {
      'Content-Type': contentType,
      'User-Agent': userAgent
    }
  })
  response.data.expiration = Date.now() + response.data.expires_in
  return response.data
}
