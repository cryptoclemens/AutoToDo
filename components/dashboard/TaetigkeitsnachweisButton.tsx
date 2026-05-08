'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const TaetigkeitsnachweisModal = dynamic(() => import('./TaetigkeitsnachweisModal'), { ssr: false })

interface Props {
  projectId?: string
  projectName?: string
  size?: 'sm' | 'default'
}

export default function TaetigkeitsnachweisButton({ projectId, projectName, size = 'default' }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
          size === 'sm'
            ? 'text-[0.8rem] font-medium h-7 px-2.5'
            : 'text-sm px-3 py-2'
        }`}
        title="Tätigkeitsnachweis anzeigen"
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        Tätigkeitsnachweis
      </button>
      {open && (
        <TaetigkeitsnachweisModal
          onClose={() => setOpen(false)}
          projectId={projectId}
          projectName={projectName}
        />
      )}
    </>
  )
}
