import * as Axios from 'axios'
import * as Scraper from './scraper.js'

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
  
  
  const endpoint = 'https://www.reddit.com/r/dankmemes/top.json?limit=50'
  const response = await fetchTopMemes(endpoint)


}

async function fetchTopMemes (url) {
  try {
    const response = await Axios.default.get(url)

    if (response.status !== 200) {
      throw new Error(`Error fetching dank memes from Reddit.\nStatus Code: ${response.status} - ${response.statusText}\nData: ${response.data}`)
    }

    return response
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
