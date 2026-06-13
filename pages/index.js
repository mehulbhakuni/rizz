import { useState, useRef, useCallback } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const TONES = [
  { id: 'funny',     emoji: '😂', label: 'Funny',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  { id: 'flirty',    emoji: '😏', label: 'Flirty',    color: '#ff5082', bg: 'rgba(255,80,130,0.12)'  },
  { id: 'confident', emoji: '🔥', label: 'Confident', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  { id: 'direct',    emoji: '⚡', label: 'Direct',    color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'   },
]

const BIO_STYLES = [
  { id: 'witty',      emoji: '😄', label: 'Witty',      desc: 'Clever, self-aware'   },
  { id: 'mysterious', emoji: '🌙', label: 'Mysterious',  desc: 'Intriguing, minimal'  },
  { id: 'wholesome',  emoji: '🌻', label: 'Wholesome',   desc: 'Warm, genuine vibes'  },
  { id: 'confident',  emoji: '💪', label: 'Confident',   desc: 'Bold, no fluff'       },
]

const LANGUAGES = [
  { id: 'English',  emoji: '🇬🇧', label: 'English'  },
  { id: 'Hindi',    emoji: '🇮🇳', label: 'Hindi'    },
  { id: 'Punjabi',  emoji: '🇮🇳', label: 'Punjabi'  },
  { id: 'Spanish',  emoji: '🇪🇸', label: 'Spanish'  },
  { id: 'Korean',   emoji: '🇰🇷', label: 'Korean'   },
  { id: 'Arabic',   emoji: '🇸🇦', label: 'Arabic'   },
]

// Resize + compress an image client-side before sending it to the API,
// so multi-photo posts don't blow up the request size.
function compressImage(file, maxDim = 1024, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round(height * (maxDim / width))
            width = maxDim
          } else {
            width = Math.round(width * (maxDim / height))
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg', dataUrl })
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '20px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#ff5082', opacity: 0.3,
          animation: 'pulse 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  )
}

function ReplyCard({ reply, tone, index, onFeedback, conversation, type }) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const toneObj = TONES.find(t => t.id === tone) || TONES[0]

  const copy = () => {
    navigator.clipboard.writeText(reply)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const sendFeedback = async (liked) => {
    setFeedback(liked ? 'up' : 'down')
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply, tone, type, liked, conversation }),
      })
    } catch (_) {}
    if (onFeedback) onFeedback(liked, reply)
  }

  const labels = ['Option A', 'Option B', 'Option C', 'Option D']

  return (
    <div className="fade-up" style={{
      background: 'rgba(255,255,255,0.04)',
      border: `0.5px solid rgba(255,255,255,0.09)`,
      borderRadius: 10,
      padding: '12px 14px',
      animationDelay: `${index * 0.07}s`,
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '3px 8px', borderRadius: 20,
          color: toneObj.color, background: toneObj.bg,
          border: `0.5px solid ${toneObj.color}44`,
        }}>
          {labels[index] || `Option ${index + 1}`}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Thumbs up / down */}
          <button onClick={() => sendFeedback(true)} title="This reply is great"
            style={{
              background: feedback === 'up' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
              border: `0.5px solid ${feedback === 'up' ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
              fontSize: 12, transition: 'all 0.15s',
            }}>👍</button>
          <button onClick={() => sendFeedback(false)} title="Not great"
            style={{
              background: feedback === 'down' ? 'rgba(255,80,130,0.1)' : 'rgba(255,255,255,0.05)',
              border: `0.5px solid ${feedback === 'down' ? 'rgba(255,80,130,0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
              fontSize: 12, transition: 'all 0.15s',
            }}>👎</button>
          <button onClick={copy} style={{
            background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.06)',
            border: `0.5px solid ${copied ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 6, padding: '3px 10px',
            fontSize: 11, fontWeight: 500, cursor: 'pointer',
            color: copied ? '#4ade80' : 'rgba(240,238,232,0.55)',
            fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
          }}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: '#f0eee8' }}>{reply}</p>
    </div>
  )
}

function SongCard({ song }) {
  return (
    <a href={song.url} target="_blank" rel="noopener noreferrer" className="fade-up" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,255,255,0.04)',
      border: '0.5px solid rgba(255,255,255,0.09)',
      borderRadius: 10, padding: '10px 12px',
      textDecoration: 'none', color: 'inherit',
      transition: 'border-color 0.2s',
    }}>
      {song.albumArt ? (
        <img src={song.albumArt} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 44, height: 44, borderRadius: 6, background: 'rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎵</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f0eee8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
        <div style={{ fontSize: 12, color: 'rgba(240,238,232,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artist}</div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 600, color: '#1ed760', flexShrink: 0,
        padding: '4px 10px', borderRadius: 20, background: 'rgba(30,215,96,0.12)',
        border: '0.5px solid rgba(30,215,96,0.3)', whiteSpace: 'nowrap',
      }}>
        ▶ Spotify
      </div>
    </a>
  )
}

export default function Home() {
  const [tab, setTab] = useState('reply')

  // Reply state
  const [convo, setConvo] = useState('')
  const [replyTone, setReplyTone] = useState('funny')
  const [replies, setReplies] = useState([])
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyError, setReplyError] = useState('')

  // Opener state
  const [profileDesc, setProfileDesc] = useState('')
  const [openerTone, setOpenerTone] = useState('funny')
  const [openers, setOpeners] = useState([])
  const [openerLoading, setOpenerLoading] = useState(false)
  const [openerError, setOpenerError] = useState('')

  // Bio state
  const [bioInfo, setBioInfo] = useState('')
  const [bioStyle, setBioStyle] = useState('witty')
  const [bios, setBios] = useState([])
  const [bioLoading, setBioLoading] = useState(false)
  const [bioError, setBioError] = useState('')

  // Story state (single photo)
  const [storyImage, setStoryImage] = useState(null) // { base64, mimeType, dataUrl }
  const [storyTone, setStoryTone] = useState('funny')
  const [storyLanguage, setStoryLanguage] = useState('English')
  const [storyResult, setStoryResult] = useState(null) // { captions, songs }
  const [storyLoading, setStoryLoading] = useState(false)
  const [storyError, setStoryError] = useState('')
  const storyFileRef = useRef()

  // Post state (multiple photos)
  const [postImages, setPostImages] = useState([]) // [{ base64, mimeType, dataUrl }]
  const [postTone, setPostTone] = useState('funny')
  const [postLanguage, setPostLanguage] = useState('English')
  const [postResult, setPostResult] = useState(null) // { captions, songs }
  const [postLoading, setPostLoading] = useState(false)
  const [postError, setPostError] = useState('')
  const postFileRef = useRef()

  const handleStoryImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setStoryResult(null)
    setStoryError('')
    try {
      const img = await compressImage(file)
      setStoryImage(img)
    } catch (_) {
      setStoryError('Could not read that image. Try a different one.')
    }
    e.target.value = ''
  }

  const handlePostImages = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setPostResult(null)
    setPostError('')
    const remaining = 5 - postImages.length
    const slice = files.slice(0, remaining)
    try {
      const compressed = await Promise.all(slice.map(f => compressImage(f)))
      setPostImages(prev => [...prev, ...compressed])
    } catch (_) {
      setPostError('Could not read one of those images. Try again.')
    }
    e.target.value = ''
  }

  const removePostImage = (index) => {
    setPostImages(prev => prev.filter((_, i) => i !== index))
    setPostResult(null)
  }

  const generateStoryCaption = async () => {
    if (!storyImage) return
    setStoryLoading(true)
    setStoryError('')
    setStoryResult(null)
    try {
      const res = await fetch('/api/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [{ base64: storyImage.base64, mimeType: storyImage.mimeType }],
          type: 'story',
          tone: storyTone,
          language: storyLanguage,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStoryResult(data)
    } catch (e) {
      setStoryError(e.message || 'Something went wrong. Try again.')
    }
    setStoryLoading(false)
  }

  const generatePostCaption = async () => {
    if (!postImages.length) return
    setPostLoading(true)
    setPostError('')
    setPostResult(null)
    try {
      const res = await fetch('/api/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: postImages.map(img => ({ base64: img.base64, mimeType: img.mimeType })),
          type: 'post',
          tone: postTone,
          language: postLanguage,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPostResult(data)
    } catch (e) {
      setPostError(e.message || 'Something went wrong. Try again.')
    }
    setPostLoading(false)
  }

  // OCR
  const [ocrLoading, setOcrLoading] = useState(false)
  const fileRef = useRef()

  const processImageFile = (file) => {
    if (!file) return
    setOcrLoading(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(',')[1]
      try {
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        })
        const data = await res.json()
        if (data.text) setConvo(data.text)
        else setConvo('')
      } catch (_) {
        alert('OCR failed — please paste the conversation manually.')
      }
      setOcrLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleOCR = (e) => {
    const file = e.target.files[0]
    processImageFile(file)
  }

  // Allow pasting a screenshot directly (Ctrl+V / Cmd+V) into the convo box
  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          processImageFile(file)
        }
        break
      }
    }
  }

  const generateReplies = async () => {
    if (!convo.trim()) return
    setReplyLoading(true)
    setReplyError('')
    setReplies([])
    try {
      // Fetch top performing replies to bias prompts
      const topRes = await fetch(`/api/top-replies?tone=${replyTone}&type=reply`)
      const { replies: topReplies } = await topRes.json()

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reply', conversation: convo, tone: replyTone, topReplies }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReplies(data.results)
    } catch (e) {
      setReplyError(e.message || 'Something went wrong. Try again.')
    }
    setReplyLoading(false)
  }

  const generateOpeners = async () => {
    if (!profileDesc.trim()) return
    setOpenerLoading(true)
    setOpenerError('')
    setOpeners([])
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'opener', profileDesc, tone: openerTone }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOpeners(data.results)
    } catch (e) {
      setOpenerError(e.message || 'Something went wrong. Try again.')
    }
    setOpenerLoading(false)
  }

  const generateBio = async () => {
    if (!bioInfo.trim()) return
    setBioLoading(true)
    setBioError('')
    setBios([])
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bio', bioInfo, bioStyle }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setBios(data.results)
    } catch (e) {
      setBioError(e.message || 'Something went wrong. Try again.')
    }
    setBioLoading(false)
  }

  const s = styles

  return (
    <>
      <Head>
        <title>RIZZ — AI Dating Assistant</title>
        <meta name="description" content="AI-powered dating replies, openers, and bios. Get more matches." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💘</text></svg>" />
      </Head>

      <div style={s.page}>
        <div style={s.bgDots} />

        <div style={s.container}>
          {/* Header */}
          <header style={s.header}>
            <div>
              <div style={s.logo}>RI<span style={s.logoAccent}>ZZ</span></div>
              <div style={s.tagline}>Your AI Dating Coach</div>
            </div>
            <div style={s.headerBadge}>✦ Find your perfect reply</div>
          </header>

          {/* Tabs */}
          <div style={s.tabs}>
            {[
              { id: 'reply',  label: '💬 Reply'  },
              { id: 'opener', label: '✨ Opener' },
              { id: 'bio',    label: '📝 Bio'    },
              { id: 'story',  label: '🎬 Story'  },
              { id: 'post',   label: '🖼️ Post'   },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── REPLY TAB ── */}
          {tab === 'reply' && (
            <div>
              <div style={s.row}>
                <label style={s.label}>Paste your convo</label>
                <button onClick={() => fileRef.current.click()} style={s.ocrBtn}>
                  {ocrLoading ? '⏳ Reading…' : '📸 Upload screenshot'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleOCR} />
              </div>

              <textarea
                value={convo}
                onChange={e => setConvo(e.target.value)}
                onPaste={handlePaste}
                placeholder={`e.g.\nThem: hey! finally matched lol\nYou: haha right, what took you so long\nThem: okay fair, so what do you do for fun?\n\n(Tip: copy a screenshot and press Ctrl+V / Cmd+V here)`}
                style={s.textarea}
              />

              <label style={{ ...s.label, marginTop: 16 }}>Pick your vibe</label>
              <div style={s.toneGrid}>
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setReplyTone(t.id)}
                    style={{
                      ...s.toneBtn,
                      ...(replyTone === t.id ? {
                        borderColor: t.color,
                        background: t.bg,
                        color: t.color,
                      } : {}),
                    }}>
                    <span style={{ fontSize: 16 }}>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>

              <button onClick={generateReplies} disabled={replyLoading || !convo.trim()} style={s.btn}>
                {replyLoading ? 'Generating…' : 'Generate Replies ✦'}
              </button>

              {replyLoading && <LoadingDots />}
              {replyError && <p style={s.error}>{replyError}</p>}
              {replies.length > 0 && (
                <div style={s.results}>
                  {replies.map((r, i) => (
                    <ReplyCard key={i} reply={r} tone={replyTone} index={i}
                      conversation={convo} type="reply" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── OPENER TAB ── */}
          {tab === 'opener' && (
            <div>
              <label style={s.label}>Describe their profile</label>
              <textarea
                value={profileDesc}
                onChange={e => setProfileDesc(e.target.value)}
                placeholder="e.g. She's 26, a nurse who loves hiking, Taylor Swift, and her golden retriever Max. Last photo was at Machu Picchu."
                style={{ ...s.textarea, minHeight: 90 }}
              />

              <label style={{ ...s.label, marginTop: 16 }}>Your vibe</label>
              <div style={s.toneGrid}>
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setOpenerTone(t.id)}
                    style={{
                      ...s.toneBtn,
                      ...(openerTone === t.id ? {
                        borderColor: t.color,
                        background: t.bg,
                        color: t.color,
                      } : {}),
                    }}>
                    <span style={{ fontSize: 16 }}>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>

              <button onClick={generateOpeners} disabled={openerLoading || !profileDesc.trim()} style={s.btn}>
                {openerLoading ? 'Generating…' : 'Generate Openers ✦'}
              </button>

              {openerLoading && <LoadingDots />}
              {openerError && <p style={s.error}>{openerError}</p>}
              {openers.length > 0 && (
                <div style={s.results}>
                  {openers.map((o, i) => (
                    <ReplyCard key={i} reply={o} tone={openerTone} index={i}
                      conversation={profileDesc} type="opener" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── BIO TAB ── */}
          {tab === 'bio' && (
            <div>
              <label style={s.label}>Tell me about yourself</label>
              <textarea
                value={bioInfo}
                onChange={e => setBioInfo(e.target.value)}
                placeholder="e.g. 24, software engineer in NYC. I play guitar, obsessed with ramen, love weekend hikes. Looking for someone to binge shows with."
                style={{ ...s.textarea, minHeight: 90 }}
              />

              <label style={{ ...s.label, marginTop: 16 }}>Bio style</label>
              <div style={s.bioGrid}>
                {BIO_STYLES.map(b => (
                  <button key={b.id} onClick={() => setBioStyle(b.id)}
                    style={{
                      ...s.bioStyleBtn,
                      ...(bioStyle === b.id ? {
                        borderColor: 'rgba(255,80,130,0.45)',
                        background: 'rgba(255,80,130,0.1)',
                        color: '#ff8ab0',
                      } : {}),
                    }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 2, color: bioStyle === b.id ? '#ff8ab0' : 'rgba(240,238,232,0.8)' }}>
                      {b.emoji} {b.label}
                    </span>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>{b.desc}</span>
                  </button>
                ))}
              </div>

              <button onClick={generateBio} disabled={bioLoading || !bioInfo.trim()} style={s.btn}>
                {bioLoading ? 'Writing…' : 'Write My Bio ✦'}
              </button>

              {bioLoading && <LoadingDots />}
              {bioError && <p style={s.error}>{bioError}</p>}
              {bios.length > 0 && (
                <div style={s.results}>
                  {bios.map((b, i) => (
                    <ReplyCard key={i} reply={b} tone="flirty" index={i}
                      conversation={bioInfo} type="bio" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STORY TAB ── */}
          {tab === 'story' && (
            <div>
              <label style={s.label}>Upload your photo</label>
              <div style={s.uploadBox} onClick={() => storyFileRef.current.click()}>
                {storyImage ? (
                  <>
                    <img src={storyImage.dataUrl} alt="" style={s.previewImg} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setStoryImage(null); setStoryResult(null) }}
                      style={s.removeBtn} title="Remove photo">✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 28 }}>🎬</span>
                    <span>Tap to upload a photo for your story</span>
                  </>
                )}
              </div>
              <input ref={storyFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleStoryImage} />

              <div style={s.sectionHeading}>Caption vibe</div>
              <div style={s.toneGrid}>
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setStoryTone(t.id)}
                    style={{
                      ...s.toneBtn,
                      ...(storyTone === t.id ? {
                        borderColor: t.color,
                        background: t.bg,
                        color: t.color,
                      } : {}),
                    }}>
                    <span style={{ fontSize: 16 }}>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>

              <div style={s.sectionHeading}>Song language</div>
              <div style={s.langGrid}>
                {LANGUAGES.map(l => (
                  <button key={l.id} onClick={() => setStoryLanguage(l.id)}
                    style={{
                      ...s.langBtn,
                      ...(storyLanguage === l.id ? {
                        borderColor: 'rgba(255,80,130,0.45)',
                        background: 'rgba(255,80,130,0.1)',
                        color: '#ff8ab0',
                      } : {}),
                    }}>
                    <span>{l.emoji}</span> {l.label}
                  </button>
                ))}
              </div>

              <button onClick={generateStoryCaption} disabled={storyLoading || !storyImage} style={s.btn}>
                {storyLoading ? 'Analyzing photo…' : 'Get Caption & Songs ✦'}
              </button>

              {storyLoading && <LoadingDots />}
              {storyError && <p style={s.error}>{storyError}</p>}

              {storyResult && (
                <>
                  {storyResult.captions?.length > 0 && (
                    <>
                      <div style={s.sectionHeading}>Caption ideas</div>
                      <div style={s.results}>
                        {storyResult.captions.map((c, i) => (
                          <ReplyCard key={i} reply={c} tone={storyTone} index={i}
                            conversation={storyResult.vibe || ''} type="caption" />
                        ))}
                      </div>
                    </>
                  )}
                  {storyResult.songs?.length > 0 && (
                    <>
                      <div style={s.sectionHeading}>Song picks ({storyLanguage})</div>
                      <div style={s.results}>
                        {storyResult.songs.map((song, i) => (
                          <SongCard key={i} song={song} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── POST TAB ── */}
          {tab === 'post' && (
            <div>
              <label style={s.label}>Upload your photos (up to 5)</label>
              <div style={s.postGrid}>
                {postImages.map((img, i) => (
                  <div key={i} style={s.postThumb}>
                    <img src={img.dataUrl} alt="" style={s.postThumbImg} />
                    <button onClick={() => removePostImage(i)} style={s.removeBtn} title="Remove photo">✕</button>
                  </div>
                ))}
                {postImages.length < 5 && (
                  <button style={s.postAddBtn} onClick={() => postFileRef.current.click()}>
                    <span style={{ fontSize: 22 }}>🖼️</span>
                    <span>Add photo{postImages.length === 0 ? 's' : ''}</span>
                  </button>
                )}
              </div>
              <input ref={postFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePostImages} />

              <div style={s.sectionHeading}>Caption vibe</div>
              <div style={s.toneGrid}>
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setPostTone(t.id)}
                    style={{
                      ...s.toneBtn,
                      ...(postTone === t.id ? {
                        borderColor: t.color,
                        background: t.bg,
                        color: t.color,
                      } : {}),
                    }}>
                    <span style={{ fontSize: 16 }}>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>

              <div style={s.sectionHeading}>Song language</div>
              <div style={s.langGrid}>
                {LANGUAGES.map(l => (
                  <button key={l.id} onClick={() => setPostLanguage(l.id)}
                    style={{
                      ...s.langBtn,
                      ...(postLanguage === l.id ? {
                        borderColor: 'rgba(255,80,130,0.45)',
                        background: 'rgba(255,80,130,0.1)',
                        color: '#ff8ab0',
                      } : {}),
                    }}>
                    <span>{l.emoji}</span> {l.label}
                  </button>
                ))}
              </div>

              <button onClick={generatePostCaption} disabled={postLoading || !postImages.length} style={s.btn}>
                {postLoading ? 'Analyzing photos…' : 'Get Caption & Songs ✦'}
              </button>

              {postLoading && <LoadingDots />}
              {postError && <p style={s.error}>{postError}</p>}

              {postResult && (
                <>
                  {postResult.captions?.length > 0 && (
                    <>
                      <div style={s.sectionHeading}>Caption ideas</div>
                      <div style={s.results}>
                        {postResult.captions.map((c, i) => (
                          <ReplyCard key={i} reply={c} tone={postTone} index={i}
                            conversation={postResult.vibe || ''} type="caption" />
                        ))}
                      </div>
                    </>
                  )}
                  {postResult.songs?.length > 0 && (
                    <>
                      <div style={s.sectionHeading}>Song picks ({postLanguage})</div>
                      <div style={s.results}>
                        {postResult.songs.map((song, i) => (
                          <SongCard key={i} song={song} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          <footer style={s.footer}>
            Made with 💘
          </footer>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0f; color: #f0eee8; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.3s ease forwards; opacity: 0; }
        textarea:focus, input:focus { outline: none; border-color: rgba(255,80,130,0.4) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0f',
    position: 'relative',
    paddingBottom: 40,
  },
  bgDots: {
    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    backgroundImage: 'radial-gradient(circle, rgba(255,80,130,0.05) 1px, transparent 1px)',
    backgroundSize: '28px 28px',
  },
  container: {
    position: 'relative', zIndex: 1,
    maxWidth: 520, margin: '0 auto',
    padding: '24px 16px',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24,
  },
  logo: {
    fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26,
    letterSpacing: '-0.5px', color: '#fff',
  },
  logoAccent: {
    background: 'linear-gradient(135deg, #ff5082, #ff9650)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  tagline: {
    fontSize: 11, color: 'rgba(240,238,232,0.3)', letterSpacing: '0.08em',
    textTransform: 'uppercase', marginTop: 2,
  },
  headerBadge: {
    fontSize: 11, color: 'rgba(240,238,232,0.3)',
    padding: '4px 10px', borderRadius: 20,
    border: '0.5px solid rgba(255,255,255,0.1)',
  },
  tabs: {
    display: 'flex', gap: 4,
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 4, marginBottom: 24,
    overflowX: 'auto',
  },
  tab: {
    flex: '0 0 auto', minWidth: 76, padding: '9px 10px', borderRadius: 8, border: 'none',
    background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
    fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
    color: 'rgba(240,238,232,0.4)', transition: 'all 0.2s',
  },
  tabActive: {
    background: 'rgba(255,80,130,0.15)',
    color: '#ff5082',
    border: '0.5px solid rgba(255,80,130,0.3)',
  },
  label: {
    display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em',
    color: 'rgba(240,238,232,0.4)', textTransform: 'uppercase', marginBottom: 8,
  },
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  ocrBtn: {
    fontSize: 11, color: 'rgba(255,80,130,0.8)', cursor: 'pointer',
    padding: '3px 10px', border: '0.5px solid rgba(255,80,130,0.3)',
    borderRadius: 6, background: 'transparent', fontFamily: 'DM Sans, sans-serif',
    fontWeight: 500, transition: 'all 0.2s',
  },
  textarea: {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '12px 14px',
    fontFamily: 'DM Sans, sans-serif', fontSize: 13.5,
    color: '#f0eee8', resize: 'vertical', minHeight: 110,
    lineHeight: 1.6, transition: 'border-color 0.2s',
  },
  toneGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16,
  },
  toneBtn: {
    padding: '9px 12px', borderRadius: 8,
    border: '0.5px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
    color: 'rgba(240,238,232,0.5)', transition: 'all 0.18s',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  bioGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16,
  },
  bioStyleBtn: {
    padding: '10px 12px', borderRadius: 8, textAlign: 'left',
    border: '0.5px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif', transition: 'all 0.18s',
    color: 'rgba(240,238,232,0.5)',
  },
  langGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16,
  },
  langBtn: {
    padding: '8px 10px', borderRadius: 8,
    border: '0.5px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif', fontSize: 12.5, fontWeight: 500,
    color: 'rgba(240,238,232,0.5)', transition: 'all 0.18s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  uploadBox: {
    width: '100%', minHeight: 140, borderRadius: 12,
    border: '1px dashed rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.02)', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 6, color: 'rgba(240,238,232,0.4)', fontFamily: 'DM Sans, sans-serif',
    fontSize: 13, transition: 'border-color 0.2s', marginBottom: 16,
    overflow: 'hidden', position: 'relative',
  },
  previewImg: {
    width: '100%', maxHeight: 260, objectFit: 'contain', display: 'block',
  },
  removeBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 26, height: 26, borderRadius: '50%',
    background: 'rgba(0,0,0,0.55)', border: '0.5px solid rgba(255,255,255,0.2)',
    color: '#f0eee8', fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  postGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16,
  },
  postThumb: {
    position: 'relative', borderRadius: 10, overflow: 'hidden',
    aspectRatio: '1 / 1', border: '0.5px solid rgba(255,255,255,0.1)',
  },
  postThumbImg: {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
  },
  postAddBtn: {
    aspectRatio: '1 / 1', borderRadius: 10,
    border: '1px dashed rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.02)', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 4, color: 'rgba(240,238,232,0.4)', fontFamily: 'DM Sans, sans-serif', fontSize: 11,
  },
  sectionHeading: {
    fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13,
    color: 'rgba(240,238,232,0.7)', marginTop: 20, marginBottom: 10,
  },
  btn: {
    width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #ff5082, #ff7650)',
    color: '#fff', fontFamily: 'Syne, sans-serif',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.15s',
    letterSpacing: '0.02em', marginTop: 4,
  },
  results: { marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  error: { fontSize: 13, color: 'rgba(255,80,130,0.7)', padding: '10px 0' },
  footer: {
    textAlign: 'center', fontSize: 11,
    color: 'rgba(240,238,232,0.2)', marginTop: 32,
  },
}
