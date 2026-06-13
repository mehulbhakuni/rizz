import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { reply, tone, type, liked, conversation } = req.body

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(200).json({ ok: true, stored: false })
  }

  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )

    await sb.from('feedback').insert({
      reply,
      tone,
      type,
      liked,
      conversation_snippet: conversation?.slice(0, 300),
      created_at: new Date().toISOString(),
    })

    return res.status(200).json({ ok: true, stored: true })
  } catch (e) {
    console.error('Feedback store error:', e)
    return res.status(200).json({ ok: true, stored: false })
  }
}
