import { callGroq } from '../../lib/groq'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageBase64, mimeType, tone, context } = req.body

  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided.' })
  }

  try {
    // 1. Look at the story screenshot and describe what's in it
    const visionRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `This is a screenshot of someone's Instagram/Snapchat story that I'm about to reply to. In 2-3 short sentences, describe: what's shown (the scene, activity, people, pets, food, etc.), the overall mood, and call out any visible text, captions, stickers, polls, questions, or music tags on the story — those are great hooks for a reply.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        }],
        max_tokens: 300,
      }),
    })

    const visionData = await visionRes.json()
    if (!visionRes.ok) {
      throw new Error(visionData.error?.message || 'Vision analysis failed')
    }
    const vibe = visionData.choices[0].message.content.trim()

    // 2. Generate text replies + quick emoji reactions
    const prompt = `Here's a description of a story someone just posted, which I want to reply to:

"${vibe}"

${context?.trim() ? `Extra context about our relationship/how I usually talk to them: "${context.trim()}"` : ''}

Do two things:
1. Write exactly 4 reply message options with a "${tone}" tone. These should react naturally to what's in the story (reference specifics — the activity, the caption, a sticker/poll if mentioned, etc.), feel like a real DM reply, and be short (1-2 sentences max).
2. Suggest exactly 4 quick emoji-only reactions (1-3 emojis each) that would also work as a fast reply to this story, ordered from most to least playful.

Respond with ONLY valid JSON, nothing else, in this exact shape:
{"replies": ["...", "...", "...", "..."], "reactions": ["...", "...", "...", "..."]}`

    const raw = await callGroq(prompt)
    const cleaned = raw.replace(/```json|```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch (_) {
      const match = cleaned.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : { replies: [], reactions: [] }
    }

    const replies = Array.isArray(parsed.replies) ? parsed.replies.slice(0, 4) : []
    const reactions = Array.isArray(parsed.reactions) ? parsed.reactions.slice(0, 4) : []

    return res.status(200).json({ replies, reactions, vibe })
  } catch (e) {
    console.error('Story reply error:', e)
    return res.status(500).json({ error: 'Could not analyze story. Please try again.' })
  }
}
