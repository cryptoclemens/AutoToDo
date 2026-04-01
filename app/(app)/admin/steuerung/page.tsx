import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/superAdmin'
import SteuerungClient from './SteuerungClient'

export default async function SteuerungPage() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const ok = await isSuperAdmin(user.id)
  if (!ok) redirect('/dashboard')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Steuerung</h1>
      <p className="text-sm text-gray-500 mb-8">Super-Admin — Friends-Codes verwalten & Nutzungsverhalten einsehen</p>
      <SteuerungClient />
    </div>
  )
}
