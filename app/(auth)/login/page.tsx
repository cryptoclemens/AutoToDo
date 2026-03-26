import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anmelden</CardTitle>
        <CardDescription>Melden Sie sich in Ihrem Workspace an.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-48 animate-pulse bg-gray-50 rounded" />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
