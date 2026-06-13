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
  },
  tab: {
    flex: 1, padding: '9px 10px', borderRadius: 8, border: 'none',
    background: 'transparent', cursor: 'pointer',
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
