import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/superAdmin'
import AdminWorkspacesClient from './AdminWorkspacesClient'

export default async function AdminWorkspacesPage() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')
  if (!await isSuperAdmin(user.id)) redirect('/dashboard')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Workspaces</h1>
      <p className="text-sm text-gray-500 mb-8">Alle Workspaces mit Nutzungs-KPIs</p>
      <AdminWorkspacesClient />
    </div>
  )
}
