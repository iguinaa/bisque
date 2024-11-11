import * as Cheerio from 'cheerio'

export function parseTopMemes (html) {
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
