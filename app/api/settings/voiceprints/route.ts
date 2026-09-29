import { NextResponse } from 'next/server'
import { getSettingsAdminCtx } from '@/lib/settingsAdmin'

export async function DELETE() {
  const ctx = await getSettingsAdminCtx()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  try {
    await ctx.supabase.from('member_voiceprints')
      .delete()
      .eq('workspace_id', ctx.workspaceId)
      .eq('user_id', ctx.userId)
  } catch { /* Tabelle evtl. noch nicht deployt */ }
  return NextResponse.json({ ok: true })
}
