'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { SimilarPair } from '@/lib/similarity'
import type { LopItem } from './LopItemDialog'

interface Props {
  pairs: SimilarPair[]
  items: LopItem[]
  onMerge: (keepId: string, deleteId: string) => Promise<void>
  onDismiss: () => void
}

export default function MergeSuggestionDialog({ pairs, items, onMerge, onDismiss }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  if (pairs.length === 0) return null

  const pair = pairs[currentIndex]
  const itemA = items.find(i => i.id === pair.a.id)
  const itemB = items.find(i => i.id === pair.b.id)

  if (!itemA || !itemB) {
    if (currentIndex < pairs.length - 1) {
      setCurrentIndex(i => i + 1)
      return null
    }
    onDismiss()
    return null
  }

  function skip() {
    if (currentIndex < pairs.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      onDismiss()
    }
  }

  async function handleMerge(keepId: string, deleteId: string) {
    setLoading(true)
    await onMerge(keepId, deleteId)
    setLoading(false)
    if (currentIndex < pairs.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      onDismiss()
    }
  }

  const pct = Math.round(pair.score * 100)

  return (
    <Dialog open onOpenChange={open => { if (!open) onDismiss() }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-100 px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-sm font-semibold text-amber-800">Ähnliche LOP-Punkte gefunden</span>
            {pairs.length > 1 && (
              <span className="ml-auto text-xs text-amber-600">{currentIndex + 1} / {pairs.length}</span>
            )}
          </div>
          <p className="text-xs text-amber-700">
            Diese beiden Punkte sind zu {pct}% ähnlich. Möchtest du sie zusammenführen?
          </p>
        </div>

        {/* Items */}
        <div className="p-5 space-y-3">
          {[itemA, itemB].map((item, idx) => (
            <div key={item.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <span className="text-xs text-gray-400 shrink-0">{idx === 0 ? 'A' : 'B'}</span>
              </div>
              {item.description && (
                <p className="text-xs text-gray-500 leading-relaxed mb-2">{item.description}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {item.responsible && (
                  <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                    {item.responsible}
                  </span>
                )}
                {item.due_date && (
                  <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                    {new Date(item.due_date).toLocaleDateString('de-DE')}
                  </span>
                )}
                <span className="text-xs text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full">
                  {item.status}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => handleMerge(item.id, idx === 0 ? itemB.id : itemA.id)}
                className="mt-3 w-full text-xs h-8 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                Diesen behalten, anderen löschen
              </Button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          <Button variant="ghost" size="sm" onClick={skip} className="flex-1 text-gray-500">
            Überspringen
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss} className="flex-1 text-gray-400">
            Alle ignorieren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
