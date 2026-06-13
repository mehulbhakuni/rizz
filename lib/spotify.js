// Simple in-memory cache for the Spotify app token (client credentials flow).
// This token is app-only (no user login needed) and is fine for search.
let cachedToken = null
let cachedExpiry = 0

async function getSpotifyToken() {
  if (cachedToken && Date.now() < cachedExpiry) return cachedToken

  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${creds}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Spotify auth error: ${err}`)
  }

  const data = await res.json()
  cachedToken = data.access_token
  // Refresh a little early to avoid edge-case expiry
  cachedExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

// Search Spotify for a track matching `query`, return the top result (or null).
export async function searchTrack(query) {
  console.log("Searching Spotify for:", query);

  const token = await getSpotifyToken()

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Spotify search error: ${err}`)
  }

  const data = await res.json()
  const track = data.tracks?.items?.[0]
  if (!track) return null

  return {
    title: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    albumArt: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || null,
    url: track.external_urls?.spotify || null,
    previewUrl: track.preview_url || null,
  }
}
