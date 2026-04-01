'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  project: {
    id: string
    name: string
    brand_color: string | null
    logo_url: string | null
    branding_inherited: boolean
  }
  workspaceId: string
}

export default function ProjectBrandingForm({ project, workspaceId: _workspaceId }: Props) {
  const router = useRouter()
  const [brandColor, setBrandColor] = useState(project.brand_color ?? '#2563EB')
  const [logoUrl, setLogoUrl] = useState<string | null>(project.logo_url)
  const [inherited, setInherited] = useState(project.branding_inherited)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const res = await fetch(`/api/settings/projects/${project.id}/branding/logo`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload fehlgeschlagen.')
      setLogoUrl(data.logo_url)
      setInherited(false)
      toast.success('Logo hochgeladen.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload fehlgeschlagen.')
    } finally {
      setUploading(false)
    }
  }

  async function handleLogoDelete() {
    if (!confirm('Projekt-Logo entfernen?')) return
    setUploading(true)
    try {
      const res = await fetch(`/api/settings/projects/${project.id}/branding/logo`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setLogoUrl(null)
      toast.success('Logo entfernt.')
      router.refresh()
    } catch {
      toast.error('Entfernen fehlgeschlagen.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/settings/projects/${project.id}/branding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_color: brandColor, branding_inherited: inherited }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Speichern fehlgeschlagen.')
      toast.success('Projekt-Branding gespeichert.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-lg">

      {/* Inherit toggle */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={inherited}
            onChange={e => setInherited(e.target.checked)}
            className="mt-0.5 rounded"
          />
          <div>
            <span className="text-sm font-semibold text-gray-900">Workspace-Branding übernehmen</span>
            <p className="text-xs text-gray-500 mt-0.5">
              Wenn aktiviert, verwendet dieses Projekt das Branding des Workspaces. Deaktivieren um eigenes Logo/Farbe zu setzen.
            </p>
          </div>
        </label>
      </div>

      {!inherited && (
        <>
          {/* Logo */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Projekt-Logo</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                {logoUrl ? (
                  <Image src={logoUrl} alt="Logo" width={64} height={64} className="object-contain w-full h-full" />
                ) : (
                  <span
                    className="text-lg font-bold text-white w-full h-full flex items-center justify-center rounded-xl"
                    style={{ backgroundColor: brandColor }}
                  >
                    {project.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Wird hochgeladen…' : 'Logo hochladen'}
                </Button>
                {logoUrl && (
                  <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700 block" onClick={handleLogoDelete} disabled={uploading}>
                    Logo entfernen
                  </Button>
                )}
                <p className="text-xs text-gray-400">PNG, JPG, SVG oder WebP, max. 2 MB</p>
              </div>
            </div>
          </div>

          {/* Farbe */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Akzentfarbe</h2>
            <div className="space-y-1">
              <Label className="text-xs">Primärfarbe</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0.5"
                />
                <Input
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  placeholder="#2563EB"
                  className="text-sm w-32 font-mono"
                />
                <span
                  className="text-xs text-white px-3 py-1 rounded-full font-medium"
                  style={{ backgroundColor: brandColor }}
                >
                  Vorschau
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={saving}
          style={{ backgroundColor: 'var(--brand)' }}
          className="text-white rounded-lg"
        >
          {saving ? 'Wird gespeichert…' : 'Speichern'}
        </Button>
      </div>
    </form>
  )
}
