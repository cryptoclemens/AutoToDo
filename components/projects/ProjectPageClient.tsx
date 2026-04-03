'use client'

import { useState } from 'react'
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
}

export default function ProjectPageClient({
  initialItems,
  projectId,
  projectName,
  workspaceId,
  canEdit,
  canAdmin,
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
        </div>
      )}
      <LopTable
        initialItems={initialItems}
        projectId={projectId}
        canEdit={canEdit}
        showAddForm={showAddForm}
        onShowAddFormChange={setShowAddForm}
      />
    </>
  )
}
