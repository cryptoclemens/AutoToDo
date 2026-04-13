import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/superAdmin'
import AdminOverviewClient from './AdminOverviewClient'

export default async function AdminPage() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')
  if (!await isSuperAdmin(user.id)) redirect('/dashboard')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin-Übersicht</h1>
      <p className="text-sm text-gray-500 mb-8">Globale KPIs aller Workspaces und Nutzer</p>
      <AdminOverviewClient />
    </div>
  )
}
