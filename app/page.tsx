import Link from 'next/link'
import Image from 'next/image'
import { Zap, Pencil, Bell, Link2, Users, BarChart3 } from 'lucide-react'
import { LandingSecuritySection, LandingLegalFooter } from '@/components/landing/LandingSecurity'
import CookieBanner from '@/components/CookieBanner'
import LandingLanguageSwitcher from '@/components/LandingLanguageSwitcher'
import { getTranslations, getLocale } from 'next-intl/server'

// AUTO-UPDATED by scripts/bump-version.sh
const APP_VERSION = '0.1.129'

export default async function LandingPage() {
  const t = await getTranslations('landing')
  const locale = await getLocale()
  const isEn = locale === 'en'

  const plans = isEn
    ? [
        { name: 'Free', price: '€0', period: null, sub: null, badge: null, features: ['1 user', '2 projects', '10 transcripts/month', 'AI extraction', 'XLSX export'], highlight: false },
        { name: 'Solo', price: '€12', period: '/mo', sub: 'plus applicable VAT', badge: 'Popular', features: ['1 user', 'Unlimited projects', 'Unlimited transcripts', '2 guests/project', 'API access'], highlight: true },
        { name: 'Team', price: '€29', period: '/mo + €8/seat', sub: 'plus applicable VAT', badge: null, features: ['Up to 20 users', 'Everything in Solo', 'Custom branding', 'Webhooks', 'Audit log'], highlight: false },
        { name: 'Business', price: '€99', period: '/mo + €6/seat', sub: 'plus applicable VAT', badge: null, features: ['Unlimited users', 'Everything in Team', 'SSO / SAML', 'Priority support', 'SLA'], highlight: false },
      ]
    : [
        { name: 'Free', price: '€0', period: null, sub: null, badge: null, features: ['1 Nutzer', '2 Projekte', '10 Transkripte/Monat', 'KI-Extraktion', 'XLSX-Export'], highlight: false },
        { name: 'Solo', price: '€12', period: '/Monat', sub: 'zzgl. gesetzl. MwSt.', badge: 'Beliebt', features: ['1 Nutzer', 'Unbegrenzte Projekte', 'Unbegrenzte Transkripte', '2 Gäste/Projekt', 'API-Zugang'], highlight: true },
        { name: 'Team', price: '€29', period: '/Monat + €8/Seat', sub: 'zzgl. gesetzl. MwSt.', badge: null, features: ['Bis 20 Nutzer', 'Alles aus Solo', 'Custom Branding', 'Webhooks', 'Audit-Log'], highlight: false },
        { name: 'Business', price: '€99', period: '/Monat + €6/Seat', sub: 'zzgl. gesetzl. MwSt.', badge: null, features: ['Unbegrenzte Nutzer', 'Alles aus Team', 'SSO / SAML', 'Priority-Support', 'SLA'], highlight: false },
      ]

  const faqItems = isEn
    ? [
        { q: 'Do I need a credit card to start?', a: 'No. The Free plan requires no payment details. Upgrade anytime when you need more.' },
        { q: 'What AI models are supported?', a: 'AutoToDo uses your own API key (BYOK) — Claude (Anthropic), GPT-4o (OpenAI), Azure OpenAI, or Perplexity AI (Sonar). You control your data and costs.' },
        { q: 'Can I invite external guests without an account?', a: 'Yes, from Solo onwards. Share a read-only link with guests — no registration required.' },
        { q: 'Is my transcript data secure?', a: 'Transcripts are encrypted at rest (AES-256-GCM) and stored in your Supabase project. AutoToDo staff has no access.' },
        { q: 'When is billing available?', a: 'Payment processing via Mollie is coming soon. Until then, all existing users remain on beta (unlimited) access.' },
      ]
    : [
        { q: 'Brauche ich eine Kreditkarte zum Start?', a: 'Nein. Der Free-Plan erfordert keine Zahlungsdaten. Upgrade jederzeit, wenn Sie mehr benötigen.' },
        { q: 'Welche KI-Modelle werden unterstützt?', a: 'AutoToDo nutzt Ihren eigenen API-Key (BYOK) – Claude (Anthropic), GPT-4o (OpenAI), Azure OpenAI oder Perplexity AI (Sonar). Sie behalten die Kontrolle über Daten und Kosten.' },
        { q: 'Kann ich externe Gäste ohne Account einladen?', a: 'Ja, ab Solo. Teilen Sie einen Lesezugriff-Link mit Gästen – keine Registrierung erforderlich.' },
        { q: 'Sind meine Transkriptdaten sicher?', a: 'Transkripte werden verschlüsselt gespeichert (AES-256-GCM) in Ihrem Supabase-Projekt. AutoToDo-Mitarbeiter haben keinen Zugriff.' },
        { q: 'Wann ist die Abrechnung verfügbar?', a: 'Die Zahlungsabwicklung über Mollie kommt in Kürze. Bis dahin haben alle bestehenden Nutzer weiterhin Beta-Zugang (unbegrenzt).' },
      ]

  const steps = isEn
    ? [
        { n: '1', title: 'Upload transcript', desc: 'Paste text or upload a .txt / .rtf file from your meeting or call.' },
        { n: '2', title: 'AI extracts tasks', desc: 'Claude, GPT-4o, Azure AI or Perplexity Sonar reads the transcript and creates structured action items with owner, deadline and priority.' },
        { n: '3', title: 'Review & export', desc: 'Check AI suggestions, edit inline, set status — then export as XLSX with your branding.' },
      ]
    : [
        { n: '1', title: 'Transkript hochladen', desc: 'Text einfügen oder .txt / .rtf-Datei aus Ihrem Meeting oder Call hochladen.' },
        { n: '2', title: 'KI extrahiert Aufgaben', desc: 'Claude, GPT-4o, Azure AI oder Perplexity Sonar liest das Transkript und erstellt strukturierte LOP-Punkte mit Verantwortlichem, Fälligkeit und Priorität.' },
        { n: '3', title: 'Prüfen & exportieren', desc: 'KI-Vorschläge prüfen, inline bearbeiten, Status setzen – auf Wunsch als XLSX ex- und importierbar.' },
      ]

  const featureList = isEn
    ? [
        { icon: '⚡', title: 'Instant extraction', desc: 'From transcript to action list in under 30 seconds.' },
        { icon: '✏️', title: 'Inline editing', desc: 'Edit every field directly in the table. No popups required.' },
        { icon: '🔔', title: 'Daily digest', desc: 'Automatic email summary of open items for each responsible person.' },
        { icon: '🔗', title: 'Public REST API', desc: 'Integrate AutoToDo into your own tools via REST API + Webhooks.' },
        { icon: '👥', title: 'Team collaboration', desc: 'Invite members with granular roles: viewer, editor, admin.' },
        { icon: '📊', title: 'XLSX export', desc: 'Export your action list as Excel with workspace branding.' },
        { icon: '📝', title: 'Notion import', desc: 'Import meeting notes directly from Notion with one click. Connect once, import anytime.' },
      ]
    : [
        { icon: '⚡', title: 'Sofort-Extraktion', desc: 'Vom Transkript zur LOP in unter 30 Sekunden.' },
        { icon: '✏️', title: 'Inline-Bearbeitung', desc: 'Jedes Feld direkt in der Tabelle bearbeiten. Kein Popup nötig.' },
        { icon: '🔔', title: 'Täglicher Digest', desc: 'Automatische E-Mail-Zusammenfassung offener Punkte je Verantwortlichem.' },
        { icon: '🔗', title: 'Öffentliche REST-API', desc: 'AutoToDo in eigene Tools einbinden via REST-API + Webhooks.' },
        { icon: '👥', title: 'Team-Zusammenarbeit', desc: 'Mitglieder einladen mit feingranularen Rollen: Betrachter, Editor, Admin.' },
        { icon: '📊', title: 'XLSX-Export', desc: 'LOP als Excel exportieren mit Workspace-Branding.' },
        { icon: '📝', title: 'Notion-Import', desc: 'Meeting-Notizen direkt aus Notion importieren – einmal verbinden, jederzeit importieren.' },
      ]

  const featureColors = [
    'bg-yellow-50 text-yellow-500',
    'bg-blue-50 text-blue-500',
    'bg-orange-50 text-orange-500',
    'bg-purple-50 text-purple-500',
    'bg-emerald-50 text-emerald-600',
    'bg-teal-50 text-teal-600',
    'bg-gray-50 text-gray-600',
  ]

  // SVG icon components — one per feature, in order
  const FEATURE_ICONS = [Zap, Pencil, Bell, Link2, Users, BarChart3, Pencil]

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .animate-float { animation: float 6s ease-in-out infinite; }
          @keyframes slide-in-row {
            from { opacity: 0; transform: translateX(-8px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          .row-1 { animation: slide-in-row 0.4s ease 0.6s both; }
          .row-2 { animation: slide-in-row 0.4s ease 1.0s both; }
          .row-3 { animation: slide-in-row 0.4s ease 1.4s both; }
          @keyframes pop-in {
            from { opacity: 0; transform: scale(0.85) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          .badge-1 { animation: pop-in 0.5s ease 1.8s both; }
          .badge-2 { animation: pop-in 0.5s ease 2.3s both; }
        }
      `}</style>
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-40">
        <div className="flex items-center gap-4">
          <span className="font-bold text-gray-900 text-lg">AutoToDo</span>
          <a href="https://www.vencly.com" target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-90 transition-opacity hidden sm:block">
            <Image src="/vencly-logo.svg" alt="vencly" width={72} height={18} />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <LandingLanguageSwitcher currentLocale={locale} />
          <Link href="/login"
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            {t('ctaLogin')}
          </Link>
          <Link href="/register"
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium">
            {t('cta')}
          </Link>
        </div>
      </nav>

      {/* Hero – 2-column */}
      <section className="relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-40 -right-32 w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute top-20 -left-24 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-sky-50 rounded-full blur-2xl opacity-60 pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center relative">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {isEn ? 'AI-powered · BYOK · GDPR-compliant' : 'KI-gestützt · BYOK · DSGVO-konform'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight">
            {isEn
              ? <>Meeting transcripts become<br /><span className="text-blue-600">action lists automatically.</span></>
              : <>Meeting-Transkripte werden<br /><span className="text-blue-600">automatisch zur LOP.</span></>}
          </h1>
          <p className="text-lg text-gray-500 mb-8 leading-relaxed">
            {isEn
              ? 'Upload your meeting protocol. AutoToDo uses your AI key to extract tasks, owners and deadlines — structured, filterable, exportable.'
              : 'Protokoll hochladen. AutoToDo nutzt Ihren KI-Key, um Aufgaben, Verantwortliche und Fristen zu extrahieren – strukturiert, filterbar, exportierbar.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register"
              className="px-6 py-3 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors shadow-sm">
              {t('cta')} →
            </Link>
            <Link href="#how-it-works"
              className="px-6 py-3 text-sm border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-md font-medium transition-colors">
              {isEn ? 'See how it works' : 'So funktioniert es'}
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            {isEn ? 'Free plan available · No credit card required' : 'Kostenloser Einstieg · Keine Kreditkarte nötig'}
          </p>
        </div>

        {/* App Mockup */}
        <div className="hidden md:block animate-float relative">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden ring-1 ring-gray-100">
            {/* Mockup Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-300" />
              <div className="w-3 h-3 rounded-full bg-yellow-300" />
              <div className="w-3 h-3 rounded-full bg-green-300" />
              <span className="ml-3 text-xs text-gray-400 font-mono">autotodo.vencly.com/projects/…</span>
            </div>
            {/* Mockup Nav */}
            <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-4">
              <span className="text-xs font-semibold text-gray-700">Plenum</span>
              <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">Dashboard</span>
              <span className="text-xs text-gray-400">Einstellungen</span>
            </div>
            {/* Mockup KPIs */}
            <div className="px-4 py-3 grid grid-cols-4 gap-2 border-b border-gray-100">
              {[
                { label: isEn ? 'Open' : 'Offen', val: '8', color: 'text-blue-600 bg-blue-50' },
                { label: isEn ? 'Overdue' : 'Überfällig', val: '2', color: 'text-red-600 bg-red-50' },
                { label: isEn ? 'Done' : 'Erledigt', val: '14', color: 'text-green-600 bg-green-50' },
                { label: isEn ? 'Total' : 'Gesamt', val: '24', color: 'text-gray-600 bg-gray-50' },
              ].map(k => (
                <div key={k.label} className={`${k.color} rounded-lg px-2 py-1.5 text-center`}>
                  <div className={`text-base font-bold ${k.color.split(' ')[0]}`}>{k.val}</div>
                  <div className="text-xs text-gray-500">{k.label}</div>
                </div>
              ))}
            </div>
            {/* Mockup Table */}
            <div className="px-4 py-2">
              <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                {isEn ? 'Action items' : 'LOP-Punkte'}
              </div>
              {[
                { title: isEn ? 'Prepare Q2 budget' : 'Q2-Budget vorbereiten', owner: 'M. Müller', prio: isEn ? 'High' : 'Hoch', status: isEn ? 'In progress' : 'In Bearbeitung', statusColor: 'bg-blue-100 text-blue-700', due: '15.04.', overdue: false },
                { title: isEn ? 'Update customer contract' : 'Kundenvertrag aktualisieren', owner: 'S. Weber', prio: isEn ? 'Medium' : 'Mittel', status: isEn ? 'Open' : 'Offen', statusColor: 'bg-gray-100 text-gray-600', due: '01.04.', overdue: true },
                { title: isEn ? 'Set up onboarding' : 'Onboarding einrichten', owner: 'J. Klein', prio: isEn ? 'Low' : 'Niedrig', status: isEn ? 'Done' : 'Erledigt', statusColor: 'bg-green-100 text-green-700', due: '20.03.', overdue: false },
              ].map((row, i) => (
                <div key={i} className={`flex items-center gap-2 py-2 border-b border-gray-50 last:border-0 row-${i + 1} ${row.status === (isEn ? 'Done' : 'Erledigt') ? 'opacity-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{row.title}</p>
                    <p className="text-xs text-gray-400">{row.owner}</p>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${row.statusColor} whitespace-nowrap shrink-0`}>{row.status}</span>
                  <span className={`text-xs whitespace-nowrap shrink-0 ${row.overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {row.overdue && '⚠ '}{row.due}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-100 flex items-center gap-2">
              <span className="text-yellow-600 text-xs">✦</span>
              <span className="text-xs text-yellow-700 font-medium">
                {isEn ? '3 AI suggestions waiting for review' : '3 KI-Vorschläge warten auf Prüfung'}
              </span>
              <span className="ml-auto text-xs text-yellow-600 underline cursor-pointer">
                {isEn ? 'Review' : 'Anzeigen'}
              </span>
            </div>
          </div>

          {/* Floating: Slack notification badge */}
          <div className="badge-1 absolute -bottom-4 -left-6 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 flex items-center gap-2.5 w-56">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-purple-600 fill-current" aria-hidden="true">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{isEn ? 'Slack notification sent' : 'Slack-Benachrichtigung'}</p>
              <p className="text-xs text-gray-400 truncate">{isEn ? 'Q2 budget · M. Müller' : 'Q2-Budget · M. Müller'}</p>
            </div>
          </div>

          {/* Floating: export badge */}
          <div className="badge-2 absolute -top-3 -right-5 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">{isEn ? 'XLSX exported' : 'XLSX exportiert'}</p>
              <p className="text-xs text-green-600">✓ {isEn ? '24 items' : '24 Punkte'}</p>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Logos / Social Proof */}
      <div className="border-y border-gray-100 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">
            {isEn ? 'Works with' : 'Kompatibel mit'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {['Anthropic Claude', 'OpenAI GPT-4o', 'Azure OpenAI', 'Notion', 'Jamie', 'Slack', 'Microsoft Teams'].map(name => (
              <span key={name} className="text-sm text-gray-400 font-medium">{name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
            {isEn ? 'How it works' : 'So funktioniert es'}
          </h2>
          <p className="text-center text-gray-500 mb-14">
            {isEn ? 'Three steps from transcript to structured action list.' : 'Drei Schritte vom Transkript zur strukturierten LOP.'}
          </p>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[calc(16.7%)] right-[calc(16.7%)] h-px bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />
            {steps.map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-5 relative z-10 shadow-lg ring-4 ring-blue-100">
                  {step.n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
            {isEn ? 'Everything your team needs' : 'Alles, was Ihr Team braucht'}
          </h2>
          <p className="text-center text-gray-500 mb-12">
            {isEn ? 'Built for consulting teams, project managers and engineering leads.' : 'Entwickelt für Beratungsteams, Projektleiter und Engineering-Leads.'}
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {featureList.map((f, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length]
              return (
              <div key={f.title} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 group cursor-pointer">
                <div className={`w-11 h-11 rounded-xl ${featureColors[i % featureColors.length]} flex items-center justify-center mb-4 transition-opacity duration-200 group-hover:opacity-80`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* BYOK */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-10 text-center">
            <div className="text-4xl mb-4">🔑</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Bring Your Own Key</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {isEn
                ? 'No black box. Use your own Anthropic or OpenAI API key. Your data goes directly to your AI provider — not through our infrastructure. Zero AI costs for us means lower prices for you.'
                : 'Keine Blackbox. Hinterlegen Sie Ihren eigenen Anthropic- oder OpenAI-API-Key. Ihre Daten gehen direkt zu Ihrem KI-Anbieter – nicht über unsere Infrastruktur. Null KI-Kosten für uns bedeutet niedrigere Preise für Sie.'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[t('tags.claude'), t('tags.gpt'), t('tags.privacy'), t('tags.gdpr')].map(tag => (
                <span key={tag} className="bg-white text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
            {isEn ? 'Simple pricing' : 'Transparente Preise'}
          </h2>
          <p className="text-center text-gray-500 mb-8">
            {isEn ? 'Start free. Scale as you grow.' : 'Kostenlos starten. Mit dem Team wachsen.'}
          </p>

          {/* Beta banner */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-5 py-3 mb-8 flex items-center gap-3 justify-center text-sm text-purple-800">
            <span className="text-purple-500">🎉</span>
            {isEn
              ? 'Beta users get unlimited access for free. Paid plans launching soon.'
              : 'Beta-Nutzer erhalten kostenlosen Vollzugang. Bezahlpläne starten bald.'}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map(plan => (
              <div key={plan.name} className={`bg-white rounded-xl border p-6 flex flex-col ${plan.highlight ? 'border-blue-500 shadow-lg ring-1 ring-blue-500' : 'border-gray-200'}`}>
                {plan.badge && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full mb-3 inline-block self-start">
                    {plan.badge}
                  </span>
                )}
                {!plan.badge && <div className="mb-[22px]" />}
                <h3 className="font-bold text-base text-gray-900">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-400 text-sm ml-1">{plan.period}</span>}
                </div>
                {plan.sub && <p className="text-xs text-gray-400 mb-4">{plan.sub}</p>}
                {!plan.sub && <div className="mb-4" />}
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className={`block w-full text-center py-2 rounded-md text-sm font-medium transition-colors ${plan.highlight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                  {isEn ? 'Get started' : 'Starten'}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-gray-400 mt-6">
            {isEn
              ? 'Prices in EUR, plus applicable VAT. Annual billing available (20% discount).'
              : 'Preise in EUR, zzgl. gesetzl. MwSt. Jahresabrechnung möglich (20% Rabatt).'}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {isEn ? 'Frequently asked questions' : 'Häufige Fragen'}
          </h2>
          <div className="space-y-4">
            {faqItems.map(item => (
              <div key={item.q} className="border border-gray-200 rounded-xl px-5 py-4">
                <p className="font-medium text-gray-900 text-sm">{item.q}</p>
                <p className="text-sm text-gray-500 mt-1.5">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Datensicherheit */}
      <LandingSecuritySection />

      {/* Footer */}
      <LandingLegalFooter />

      {/* Cookie-Hinweis */}
      <CookieBanner />

      {/* Versions-Badge */}
      <div className="fixed bottom-4 right-4 z-50">
        <span className="bg-gray-900 text-gray-300 text-xs font-mono px-3 py-1.5 rounded-full shadow-lg border border-gray-700 select-none">
          v{APP_VERSION}
        </span>
      </div>
    </div>
  )
}
