import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from './LoginForm'
import { getTranslations } from 'next-intl/server'

export default async function LoginPage() {
  const t = await getTranslations('auth')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('loginTitle')}</CardTitle>
        <CardDescription>{t('loginSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-48 animate-pulse bg-gray-50 rounded" />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
