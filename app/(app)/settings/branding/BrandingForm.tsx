'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  workspace: {
    id: string
    name: string
    brand_color: string
    logo_url: string | null
  }
}

export default function BrandingForm({ workspace }: Props) {
  const router = useRouter()
  const [name, setName] = useState(workspace.name)
  const [brandColor, setBrandColor] = useState(workspace.brand_color ?? '#2563EB')
  const [logoUrl, setLogoUrl] = useState<string | null>(workspace.logo_url)
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
      const res = await fetch('/api/settings/branding/logo', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload fehlgeschlagen.')
      setLogoUrl(data.logo_url)
      toast.success('Logo hochgeladen.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload fehlgeschlagen.')
    } finally {
      setUploading(false)
    }
  }

  async function handleLogoDelete() {
    if (!confirm('Logo wirklich entfernen?')) return
    setUploading(true)
    try {
      const res = await fetch('/api/settings/branding/logo', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setLogoUrl(null)
      toast.success('Logo entfernt.')
      router.refresh()
    } catch {
      toast.error('Logo konnte nicht entfernt werden.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/settings/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, brand_color: brandColor }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Speichern fehlgeschlagen.')
      toast.success('Branding gespeichert.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-lg">

      {/* Logo */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Workspace-Logo</h2>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo" width={64} height={64} className="object-contain w-full h-full" />
            ) : (
              <span
                className="text-lg font-bold text-white px-2 py-1 rounded"
                style={{ backgroundColor: brandColor }}
              >
                {workspace.name.slice(0, 2).toUpperCase()}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Lädt hoch…' : 'Logo hochladen'}
            </Button>
            {logoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 block"
                onClick={handleLogoDelete}
                disabled={uploading}
              >
                Logo entfernen
              </Button>
            )}
            <p className="text-xs text-gray-400">PNG, JPG, WebP oder SVG · max. 2 MB</p>
          </div>
        </div>
      </div>

      {/* Name & Farbe */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Workspace-Name & Akzentfarbe</h2>

        <div className="space-y-1">
          <Label className="text-xs">Workspace-Name</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            className="text-sm max-w-xs"
            required
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Akzentfarbe</Label>
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
              className="text-xs text-white px-3 py-1 rounded font-medium"
              style={{ backgroundColor: brandColor }}
            >
              Vorschau
            </span>
          </div>
          <p className="text-xs text-gray-400">Wird für Buttons, Badges und Highlights verwendet.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={saving}
          style={{ backgroundColor: 'var(--brand)' }}
          className="text-white"
        >
          {saving ? 'Speichert…' : 'Speichern'}
        </Button>
      </div>
    </form>
  )
}
