'use client'

import { useState } from 'react'
import Link from 'next/link'
import LopTable from '@/components/lop/LopTable'
import ProjectInviteButton from './ProjectInviteButton'
import ProjectMembersDialog from './ProjectMembersDialog'
import DesktopRecordButton from '@/components/desktop/DesktopRecordButton'
import { Button } from '@/components/ui/button'
import type { LopItem } from '@/components/lop/LopItemDialog'

interface Props {
  initialItems: LopItem[]
  projectId: string
  projectName: string
  workspaceId: string
  canEdit: boolean
  canAdmin: boolean
  currentLocale?: string
}

export default function ProjectPageClient({
  initialItems,
  projectId,
  projectName,
  workspaceId,
  canEdit,
  canAdmin,
  currentLocale,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <>
      {(canAdmin || canEdit) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {canAdmin && (
            <ProjectInviteButton
              workspaceId={workspaceId}
              projectId={projectId}
              projectName={projectName}
            />
          )}
          {canAdmin && (
            <ProjectMembersDialog projectId={projectId} />
          )}
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setShowAddForm(v => !v)}
            >
              + LOP-Punkt hinzufügen
            </Button>
          )}
          {canEdit && (
            <DesktopRecordButton projectId={projectId} />
          )}
          <Link
            href={`/projects/${projectId}/transcripts`}
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-3 h-8 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Transkript-Historie
          </Link>
        </div>
      )}
      <LopTable
        initialItems={initialItems}
        projectId={projectId}
        currentLocale={currentLocale}
        canEdit={canEdit}
        showAddForm={showAddForm}
        onShowAddFormChange={setShowAddForm}
      />
    </>
  )
}
