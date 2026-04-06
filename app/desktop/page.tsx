import Link from 'next/link'
import { getLocale } from 'next-intl/server'

interface GithubAsset {
  name: string
  browser_download_url: string
  size: number
}

interface GithubRelease {
  tag_name: string
  name: string
  published_at: string
  body: string
  assets: GithubAsset[]
}

async function getLatestRelease(): Promise<GithubRelease | null> {
  try {
    const res = await fetch(
      'https://api.github.com/repos/cryptoclemens/AutoToDo-Desktop/releases/latest',
      {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'AutoToDo' },
        next: { revalidate: 3600 }, // cache 1 hour
      }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function formatBytes(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(0) + ' MB'
}

export default async function DesktopPage() {
  const locale = await getLocale()
  const isEn = locale === 'en'
  const release = await getLatestRelease()

  const macArmAsset = release?.assets.find(a => a.name.endsWith('.dmg') && (a.name.includes('aarch64') || a.name.includes('arm')))
  const macIntelAsset = release?.assets.find(a => a.name.endsWith('.dmg') && (a.name.includes('x86_64') || a.name.includes('x64')))
  const macAsset = macArmAsset ?? release?.assets.find(a => a.name.endsWith('.dmg'))
  const windowsAsset = release?.assets.find(a => a.name.endsWith('.msi') || a.name.endsWith('.exe'))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">AutoToDo</Link>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
            {isEn ? 'Back to app' : 'Zurück zur App'}
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-6 shadow-lg">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="4" width="20" height="14" rx="2" stroke="white" strokeWidth="1.8" />
              <path d="M9 22h10M14 18v4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="14" cy="10" r="3" fill="white" opacity=".9" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {isEn ? 'AutoToDo Desktop' : 'AutoToDo Desktop'}
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            {isEn
              ? 'Record meetings directly, transcribe locally with Whisper — your data stays on your device.'
              : 'Meetings direkt aufnehmen, lokal mit Whisper transkribieren — deine Daten bleiben auf deinem Gerät.'}
          </p>
          {release && (
            <p className="text-sm text-gray-400 mt-2">
              {isEn ? 'Latest version' : 'Aktuelle Version'}: <span className="font-medium text-gray-600">{release.tag_name}</span>
            </p>
          )}
        </div>

        {/* Download cards */}
        {release ? (
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {/* macOS */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                    <path d="M14.5 10.5c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.3 2.8 2.2 1.1 0 1.5-.7 2.9-.7 1.3 0 1.7.7 2.9.7 1.2 0 2-1.1 2.7-2.2.9-1.2 1.2-2.5 1.2-2.6-.1 0-2.3-.9-2.3-3.5z" />
                    <path d="M12.4 4.2c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.6-.9 2.6 1 0 1.9-.5 2.5-1.2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">macOS</h3>
                  <p className="text-xs text-gray-400">macOS 12.3+</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {macArmAsset && (
                  <a
                    href={macArmAsset.browser_download_url}
                    className="flex items-center justify-between p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <span className="font-medium text-sm">
                      {isEn ? 'Download for Apple Silicon' : 'Download für Apple Silicon'} (M1/M2/M3)
                    </span>
                    <span className="text-xs opacity-70">{formatBytes(macArmAsset.size)}</span>
                  </a>
                )}
                {macIntelAsset && (
                  <a
                    href={macIntelAsset.browser_download_url}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <span className="font-medium text-sm">
                      {isEn ? 'Download for Intel Mac' : 'Download für Intel Mac'}
                    </span>
                    <span className="text-xs opacity-60">{formatBytes(macIntelAsset.size)}</span>
                  </a>
                )}
                {!macArmAsset && !macIntelAsset && macAsset && (
                  <a
                    href={macAsset.browser_download_url}
                    className="flex items-center justify-between p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <span className="font-medium text-sm">Download macOS (.dmg)</span>
                    <span className="text-xs opacity-70">{formatBytes(macAsset.size)}</span>
                  </a>
                )}
                {!macAsset && (
                  <p className="text-sm text-gray-400 text-center py-2">{isEn ? 'Build in progress…' : 'Build läuft…'}</p>
                )}
              </div>
            </div>

            {/* Windows */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                    <path d="M2 3.5L9.5 2.5V9.5H2V3.5ZM10.5 2.3L18 1V9.5H10.5V2.3ZM2 10.5H9.5V17.5L2 16.5V10.5ZM10.5 10.5H18V19L10.5 17.7V10.5Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Windows</h3>
                  <p className="text-xs text-gray-400">Windows 10/11 (64-bit)</p>
                </div>
              </div>
              {windowsAsset ? (
                <a
                  href={windowsAsset.browser_download_url}
                  className="flex items-center justify-between p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <span className="font-medium text-sm">
                    {isEn ? 'Download for Windows' : 'Download für Windows'} (.msi)
                  </span>
                  <span className="text-xs opacity-70">{formatBytes(windowsAsset.size)}</span>
                </a>
              ) : (
                <p className="text-sm text-gray-400 text-center py-2">{isEn ? 'Build in progress…' : 'Build läuft…'}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mb-12">
            <p className="text-gray-500">
              {isEn ? 'No release available yet. Check back soon.' : 'Noch kein Release verfügbar. Bald hier.'}
            </p>
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: '🎙',
              title: isEn ? 'Record directly' : 'Direkt aufnehmen',
              desc: isEn ? 'One click per LOP list — record, pause, stop.' : 'Ein Klick pro LOP-Liste — aufnehmen, pausieren, stoppen.',
            },
            {
              icon: '🔒',
              title: isEn ? 'Local transcription' : 'Lokale Transkription',
              desc: isEn ? 'Whisper runs on your device. Audio never leaves your computer.' : 'Whisper läuft auf deinem Gerät. Audio verlässt deinen Computer nicht.',
            },
            {
              icon: '⚡',
              title: isEn ? 'Auto LOP update' : 'Automatisches LOP-Update',
              desc: isEn ? 'After transcription, AI extracts tasks and updates your LOP instantly.' : 'Nach der Transkription extrahiert die KI Aufgaben und aktualisiert das LOP.',
            },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
