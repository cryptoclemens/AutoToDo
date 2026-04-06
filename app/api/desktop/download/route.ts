import { NextRequest, NextResponse } from 'next/server'

const REPO = 'cryptoclemens/AutoToDo-Desktop'

async function getRelease() {
  const token = process.env.GITHUB_DESKTOP_TOKEN
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'AutoToDo' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=1`, { headers })
  if (!res.ok) return null
  const releases = await res.json()
  return releases[0] ?? null
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') // 'mac' | 'windows'
  const token = process.env.GITHUB_DESKTOP_TOKEN
  if (!token) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const release = await getRelease()
  if (!release) return NextResponse.json({ error: 'No release found' }, { status: 404 })

  const asset = type === 'mac'
    ? release.assets.find((a: { name: string }) => a.name.endsWith('.dmg'))
    : release.assets.find((a: { name: string }) => a.name.endsWith('.msi') || a.name.endsWith('.exe'))

  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  // Fetch asset with auth → GitHub redirects to signed CDN URL
  const assetRes = await fetch(`https://api.github.com/repos/${REPO}/releases/assets/${asset.id}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/octet-stream', 'User-Agent': 'AutoToDo' },
    redirect: 'manual',
  })

  const cdnUrl = assetRes.headers.get('location')
  if (!cdnUrl) return NextResponse.json({ error: 'Download URL not found' }, { status: 502 })

  return NextResponse.redirect(cdnUrl)
}
