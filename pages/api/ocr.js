export const config = { api: { bodyParser: { sizeLimit: '5mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageBase64, mimeType } = req.body

  try {
    // llama-3.2-11b-vision-preview was decommissioned by Groq — use llama-4-scout (vision-capable)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
              {
                type: 'text',
                text: 'Extract the text conversation from this dating app screenshot. Format each message as "Name: message text" on its own line. Only output the raw conversation, nothing else.',
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'OCR failed')
    }

    const text = data.choices[0].message.content.trim()
    return res.status(200).json({ text })
  } catch (e) {
    console.error('OCR error:', e)
    return res.status(500).json({ error: 'Could not read screenshot. Please paste the conversation manually.' })
  }
}
