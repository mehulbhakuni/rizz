import Head from 'next/head'

export default function Offline() {
  return (
    <>
      <Head>
        <title>RIZZ — Offline</title>
        <meta name="theme-color" content="#1a0e16" />
      </Head>
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        background: '#1a0e16', color: '#f0eee8',
        fontFamily: 'DM Sans, sans-serif', padding: 24,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💘</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, marginBottom: 8 }}>
          You're offline
        </h1>
        <p style={{ color: 'rgba(240,238,232,0.55)', fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>
          RIZZ needs an internet connection to generate replies, captions, and song picks.
          Reconnect and try again — pages you've already visited will still load offline.
        </p>
      </div>
    </>
  )
}
