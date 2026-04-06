import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import './globals.css'

export const metadata: Metadata = {
  title: 'AutoToDo – KI-gestütztes LOP-Management',
  description: 'Meeting-Transkripte hochladen, KI extrahiert offene Punkte – LOP immer aktuell.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
