import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import './globals.css'

const inter = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700'], display: 'swap', preload: false })

export const metadata: Metadata = {
  title: 'AutoToDo – KI-gestütztes LOP-Management',
  description: 'Meeting-Transkripte hochladen, KI extrahiert offene Punkte – LOP immer aktuell.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={inter.variable}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
