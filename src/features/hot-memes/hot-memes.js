import * as Axios from 'axios'
import * as Scraper from './scraper.js'
import * as RedditHelper from '../../depends/reddit/auth.js'

let token = null

export async function getHotMemeScraping () {
  const memes = await scrapeHotMemes()
  const memeImageUrl = selectRandomMemeUrl(memes)
  const meme = await fetchMeme(memeImageUrl)
  return meme
}

async function scrapeHotMemes () {
  const html = (await fetchTopMemes('https://www.reddit.com/r/dankmemes')).data
  const memes = Scraper.parseTopMemes(html)
  return memes
}

export async function getHotMeme () {
  return getHotRedditMeme()
}

async function getHotRedditMeme () {
  if (!token) {
    token = await RedditHelper.fetchRedditToken()
  }

  if (token.expiration < Date.now()) {
    // Need to update this to get a refresh token instead of reauthenticating to match best practice.
    token = await RedditHelper.fetchRedditToken()
  }

  const endpoint = 'https://oauth.reddit.com/r/dankmemes/top.json?limit=50'
  const memes = (await fetchTopMemes(endpoint, token.access_token)).data.children.map(child => child.data.url)
  const memeImageUrl = selectRandomMemeUrl(memes)
  const meme = await fetchMeme(memeImageUrl)
  return meme
}

async function fetchTopMemes (url, token) {
  try {
    const response = await Axios.default.get(url, {
      headers: {
        'User-Agent': RedditHelper.userAgent,
        'Content-Type': RedditHelper.contentType
      },
      auth: {
        bearer: token
      }
    })

    if (response.status !== 200) {
      throw new Error(`Error fetching dank memes from Reddit.\nStatus Code: ${response.status} - ${response.statusText}\nData: ${response.data}`)
    }

    return response.data
  } catch (err) {
    console.log(err)
    throw err
  }
}

function selectRandomMemeUrl (memes) {
  const randomIndex = Math.floor(Math.random() * memes.length)
  return memes[randomIndex]
}

async function fetchMeme (memeImageUrl) {
  try {
    const response = await Axios.default.get(memeImageUrl, { responseType: 'arraybuffer' })
    const mimeType = response.headers['content-type']
    const extension = getExtensionFromMimeType(mimeType)
    const normalizedData = Buffer.from(response.data)
    return {
      imageData: normalizedData,
      extension
    }
  } catch (err) {
    console.log(err)
    throw err
  }
}

function getExtensionFromMimeType (mimeType) {
  // Define a mapping of common MIME types to file extensions
  const mimeToExtensionMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg',
    'image/tiff': 'tiff'
  }

  // Return the corresponding extension, or 'jpg' as a default
  return mimeToExtensionMap[mimeType] || 'jpg'
}
