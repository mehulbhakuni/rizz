import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const { tone, type } = req.query

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(200).json({ replies: [] })
  }

  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )

    const { data } = await sb
      .from('feedback')
      .select('reply')
      .eq('tone', tone)
      .eq('type', type || 'reply')
      .eq('liked', true)
      .order('created_at', { ascending: false })
      .limit(5)

    const replies = data?.map(r => r.reply) || []
    return res.status(200).json({ replies })
  } catch (e) {
    return res.status(200).json({ replies: [] })
  }
}
