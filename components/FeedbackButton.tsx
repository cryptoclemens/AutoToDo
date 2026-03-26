'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<'general' | 'bug' | 'feature' | 'other'>('general')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), category }),
      })
      if (!res.ok) throw new Error()
      toast.success('Feedback gesendet. Danke!')
      setMessage('')
      setCategory('general')
      setOpen(false)
    } catch {
      toast.error('Feedback konnte nicht gesendet werden.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-50 bg-white border border-gray-200 text-gray-600 text-xs px-3 py-2 rounded-full shadow-md hover:shadow-lg hover:border-gray-300 hover:text-gray-900 transition-all flex items-center gap-1.5"
        aria-label="Feedback senden"
      >
        <span>💬</span>
        <span>Feedback</span>
      </button>

      {/* Backdrop + Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-start p-5">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-80 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Feedback & Feature-Wünsche</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Select value={category} onValueChange={v => setCategory(v as typeof category)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Allgemeines Feedback</SelectItem>
                  <SelectItem value="feature">Feature-Wunsch</SelectItem>
                  <SelectItem value="bug">Fehler melden</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Was möchtest du uns mitteilen?"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="text-sm resize-none"
                autoFocus
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || !message.trim()}
                  style={{ backgroundColor: 'var(--brand)' }}
                  className="text-white"
                >
                  {loading ? 'Sende…' : 'Senden'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
