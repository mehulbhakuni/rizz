import { callGroq } from '../../lib/groq'
import { searchTrack } from '../../lib/spotify'

export const config = { api: { bodyParser: { sizeLimit: '15mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { images, type, tone, language } = req.body

  if (!images || !images.length) {
    return res.status(400).json({ error: 'No image provided.' })
  }

  try {
    // 1. Look at the photo(s) and describe the vibe/setting/mood
    const visionContent = [
      {
        type: 'text',
        text: `This ${
          images.length > 1 ? `set of ${images.length} photos is` : 'photo is'
        } being prepared for an Instagram ${
          type === 'story' ? 'Story' : 'Post'
        }. In 2-3 short sentences, describe the setting, mood, colors, and what's happening — focus on the overall vibe, not tiny details.`,
      },
      ...images.map(img => ({
        type: 'image_url',
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
      })),
    ]

    const visionRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{ role: 'user', content: visionContent }],
          max_tokens: 300,
        }),
      }
    )

    const visionData = await visionRes.json()

    if (!visionRes.ok) {
      throw new Error(visionData.error?.message || 'Vision analysis failed')
    }

    const vibe = visionData.choices[0].message.content.trim()

    console.log('========== VIBE ANALYSIS ==========')
    console.log(vibe)
    console.log('===================================')

    // 2. Generate captions + song search queries
    const prompt = `Here's a description of ${
      images.length > 1 ? 'photos' : 'a photo'
    } someone is about to post on Instagram as a ${
      type === 'story' ? 'Story' : 'Post'
    }:

"${vibe}"

Do two things:
1. Write exactly 4 caption options with a "${tone}" tone. Keep each one short (1-2 lines), natural, and Instagram-ready. Use emojis only where they fit naturally — don't overdo it.
2. Suggest exactly 3 real, well-known songs in ${language} whose mood/lyrics/vibe would pair well with this photo for a background track. Give each as a plain "Song Title Artist Name" search string — no extra commentary, no quotes, no numbering text.

Respond with ONLY valid JSON, nothing else, in this exact shape:
{"captions": ["...", "...", "...", "..."], "songQueries": ["...", "...", "..."]}`

    const raw = await callGroq(prompt)

    console.log('========== RAW AI RESPONSE ==========')
    console.log(raw)
    console.log('=====================================')

    const cleaned = raw.replace(/```json|```/g, '').trim()

    let parsed

    try {
      parsed = JSON.parse(cleaned)
    } catch (_) {
      const match = cleaned.match(/\{[\s\S]*\}/)

      parsed = match
        ? JSON.parse(match[0])
        : { captions: [], songQueries: [] }
    }

    const captions = Array.isArray(parsed.captions)
      ? parsed.captions.slice(0, 4)
      : []

    const songQueries = Array.isArray(parsed.songQueries)
      ? parsed.songQueries.slice(0, 3)
      : []

    console.log('========== PARSED OUTPUT ==========')
    console.log('Captions:', captions)
    console.log('Song Queries:', songQueries)
    console.log('===================================')

    // 3. Look up each song on Spotify

    console.log('========== SPOTIFY DEBUG ==========')

    const songResults = await Promise.all(
      songQueries.map(async q => {
        try {
          console.log('Searching Spotify for:', q)

          const result = await searchTrack(q)

          console.log('Spotify result for:', q)
          console.log(result)

          return result
        } catch (err) {
          console.error('Spotify search failed for:', q)
          console.error(err)

          return null
        }
      })
    )

    console.log('Raw Spotify Results:')
    console.log(songResults)

    const songs = songResults.filter(Boolean)

    console.log('Filtered Songs:')
    console.log(songs)

    console.log('Songs Found:', songs.length)

    console.log('===================================')

    return res.status(200).json({
      captions,
      songs,
      vibe,
    })
  } catch (e) {
    console.error('Caption error:', e)

    return res.status(500).json({
      error: 'Could not analyze photo. Please try again.',
    })
  }
}