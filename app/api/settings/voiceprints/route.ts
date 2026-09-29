import { NextResponse } from 'next/server'
import { getSettingsAdminCtx } from '@/lib/settingsAdmin'

export async function DELETE() {
  const ctx = await getSettingsAdminCtx()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  const { error } = await ctx.supabase.from('member_voiceprints')
    .delete()
    .eq('workspace_id', ctx.workspaceId)
    .eq('user_id', ctx.userId)
  // 42P01 = Tabelle (noch) nicht vorhanden -> tolerieren; sonst echter Fehler -> 500
  if (error && (error as { code?: string }).code !== '42P01') {
    return NextResponse.json({ error: 'Löschen fehlgeschlagen.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
