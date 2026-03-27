import Link from 'next/link'
import Image from 'next/image'

export default function LegalPageShell({ title, updatedAt, children }: {
  title: string
  updatedAt?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-gray-900 text-lg hover:text-gray-700 transition-colors">
            AutoToDo
          </Link>
          <a href="https://www.vencly.com" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
            <Image src="/vencly-logo.svg" alt="vencly" width={80} height={20} />
          </a>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
            Anmelden
          </Link>
          <Link href="/register" className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
            Kostenlos starten
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        {updatedAt && (
          <p className="text-sm text-gray-400 mb-10">Stand: {updatedAt}</p>
        )}
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">© 2026 vencly GmbH · Alle Rechte vorbehalten</p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link href="/agb" className="hover:text-gray-600 transition-colors">AGB</Link>
            <Link href="/datenschutz" className="hover:text-gray-600 transition-colors">Datenschutzerklärung</Link>
            <Link href="/impressum" className="hover:text-gray-600 transition-colors">Impressum</Link>
            <Link href="/datensicherheit" className="hover:text-gray-600 transition-colors">Datensicherheit</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
