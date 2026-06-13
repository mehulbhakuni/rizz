import { callGroq } from '../../lib/groq'
import { createClient } from '@supabase/supabase-js'

const toneGuide = {
  funny: 'witty, playful, uses clever humor or light teasing. Natural and charming.',
  flirty: 'flirty and magnetic, creates subtle tension. Tasteful but leaves them wanting more.',
  confident: 'self-assured and effortlessly cool. Brief, impactful, slightly challenging.',
  direct: 'straightforward and genuine. No games — moves the conversation forward boldly.',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { type, conversation, tone, profileDesc, bioInfo, bioStyle, topReplies } = req.body

  try {
    let prompt = ''
    let systemPrompt = `You are an elite dating coach AI. You write replies that feel completely human — never cringe, never try-hard. Always return ONLY a valid JSON array of strings, nothing else. No markdown, no explanation.`

    if (type === 'reply') {
      const examplesBlock = topReplies?.length
        ? `\n\nHigh-performing example replies users loved (use as inspiration, not copy):\n${topReplies.map((r, i) => `${i + 1}. "${r}"`).join('\n')}`
        : ''

      prompt = `Generate 3 reply options for this dating app conversation. Tone: ${tone} — ${toneGuide[tone]}

Conversation:
${conversation}
${examplesBlock}

Rules:
- Each reply under 2 sentences
- Sound like a real human texting, not an AI
- Reference something from the conversation
- Vary the approach across the 3 options

Return ONLY: ["reply1", "reply2", "reply3"]`

    } else if (type === 'opener') {
      prompt = `Generate 3 unique opening messages for this dating profile. Tone: ${tone} — ${toneGuide[tone]}

Profile info: ${profileDesc}

Rules:
- Under 2 sentences each
- Reference something specific from their profile
- Avoid "hey", "hi", generic compliments
- Feel spontaneous and natural, not rehearsed

Return ONLY: ["opener1", "opener2", "opener3"]`

    } else if (type === 'bio') {
      const styleGuide = {
        witty: 'Clever and self-aware with a light touch of self-deprecating humor. Punchy.',
        mysterious: 'Minimal and intriguing. Leaves obvious questions unanswered to spark curiosity.',
        wholesome: 'Warm, genuine, and approachable. Shows real personality and interests.',
        confident: 'Bold and direct. No filler — only facts that make someone want to swipe right.',
      }
      prompt = `Write 2 dating app bio versions for this person using the "${bioStyle}" style: ${styleGuide[bioStyle]}

About them: ${bioInfo}

Rules:
- Under 150 characters each
- Sound 100% human
- No emojis unless they perfectly fit
- Each bio should be a completely different angle

Return ONLY: ["bio1", "bio2"]`
    }

    const raw = await callGroq(prompt, systemPrompt)
    const clean = raw.replace(/```json|```/g, '').trim()
    const results = JSON.parse(clean)

    // Log to Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      )
      await sb.from('generations').insert({
        type,
        tone: tone || bioStyle,
        results,
        created_at: new Date().toISOString(),
      })
    }

    return res.status(200).json({ results })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Generation failed. Try again.' })
  }
}
