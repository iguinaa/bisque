import * as Axios from 'axios'
import * as Cheerio from 'cheerio'

export async function getHotMeme () {
  const html = await fetchTopMemesHtml()
  const memes = parseTopMemes(html)
  const memeImageUrl = selectRandomMemeUrl(memes)
  const meme = await fetchMeme(memeImageUrl)
  return meme
}

async function fetchTopMemesHtml () {
  try {
    const response = await Axios.default.get('https://www.reddit.com/r/dankmemes')

    if (response.status !== 200) {
      throw new Error(`Error fetching dank memes from Reddit.\nStatus Code: ${response.status} - ${response.statusText}\nData: ${response.data}`)
    }

    const html = response.data
    return html
  } catch (err) {
    console.log(err)
    throw err
  }
}

function parseTopMemes (html) {
  const $ = Cheerio.load(html)
  const memes = []

  $('img.preview-img').each((i, elem) => {
    const imageUrl = $(elem).attr('src')
    if (imageUrl && imageUrl.includes('preview.redd.it')) {
      memes.push(imageUrl)
    }
  })
  return memes
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
