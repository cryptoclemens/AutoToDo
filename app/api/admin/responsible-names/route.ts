import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/superAdmin'
import { z } from 'zod'

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function checkAdmin() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null
  if (!await isSuperAdmin(user.id)) return null
  return user
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

  const supabase = db()
  const { data, error } = await supabase.rpc('get_responsible_name_counts')

  if (error) {
    // Fallback: raw query via pg (RPC may not exist yet — use a workaround)
    const { data: items } = await supabase
      .from('lop_items')
      .select('responsible')
      .not('responsible', 'is', null)
      .neq('responsible', '')

    const counts: Record<string, number> = {}
    for (const row of items ?? []) {
      const name = row.responsible as string
      counts[name] = (counts[name] ?? 0) + 1
    }
    const result = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
    return NextResponse.json(result)
  }

  return NextResponse.json(data)
}

const mergeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
})

export async function POST(request: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

  const body = await request.json()
  const parsed = mergeSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })

  const { from, to } = parsed.data
  if (from === to) return NextResponse.json({ error: 'Von und Nach sind identisch.' }, { status: 400 })

  const supabase = db()
  const { count, error } = await supabase
    .from('lop_items')
    .update({ responsible: to })
    .eq('responsible', from)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, updated: count ?? 0 })
}
