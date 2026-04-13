import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/superAdmin'
import AdminNav from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')
  if (!await isSuperAdmin(user.id)) redirect('/dashboard')

  return (
    <div>
      <AdminNav />
      <div className="mt-6">{children}</div>
    </div>
  )
}
