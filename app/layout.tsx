import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap', preload: false })

export const metadata: Metadata = {
  title: 'AutoToDo – KI-gestütztes LOP-Management',
  description: 'Meeting-Transkripte hochladen, KI extrahiert offene Punkte – LOP immer aktuell.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
