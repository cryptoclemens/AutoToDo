import Link from 'next/link'
import Image from 'next/image'
import { Zap, Pencil, Bell, Link2, Users, BarChart3, FileText, Shield, RefreshCw, Download } from 'lucide-react'
import { LandingSecuritySection, LandingLegalFooter } from '@/components/landing/LandingSecurity'
import CookieBanner from '@/components/CookieBanner'
import LandingLanguageSwitcher from '@/components/LandingLanguageSwitcher'
import ThemeToggle from '@/components/ThemeToggle'
import { getTranslations, getLocale } from 'next-intl/server'
import PricingSection from './PricingSection'

// AUTO-UPDATED by scripts/bump-version.sh
const APP_VERSION = '0.1.174'

export default async function LandingPage() {
  const t = await getTranslations('landing')
  const locale = await getLocale()
  const isEn = locale === 'en'

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

  // Feature highlights for the 2-block layout (left side — 3 prominent)
  const featureHighlights = isEn
    ? [
        {
          Icon: Zap,
          color: 'bg-yellow-50 text-yellow-500',
          title: 'Instant AI Extraction',
          desc: 'From transcript to structured action list in under 30 seconds. Claude, GPT-4o, or Perplexity — you choose.',
          mockup: 'extraction',
        },
        {
          Icon: Pencil,
          color: 'bg-blue-50 text-blue-500',
          title: 'Inline Editing',
          desc: 'Edit owner, deadline, priority and status directly in the table row. No popup, no context switch.',
          mockup: 'editing',
        },
        {
          Icon: Bell,
          color: 'bg-orange-50 text-orange-500',
          title: 'Daily Digest',
          desc: 'Each responsible person receives an automatic email summary of their open action items — every morning.',
          mockup: 'digest',
        },
      ]
    : [
        {
          Icon: Zap,
          color: 'bg-yellow-50 text-yellow-500',
          title: 'Sofort-KI-Extraktion',
          desc: 'Vom Transkript zur strukturierten LOP in unter 30 Sekunden. Claude, GPT-4o oder Perplexity – Sie wählen.',
          mockup: 'extraction',
        },
        {
          Icon: Pencil,
          color: 'bg-blue-50 text-blue-500',
          title: 'Inline-Bearbeitung',
          desc: 'Verantwortliche, Fälligkeit, Priorität und Status direkt in der Tabellenzeile bearbeiten – kein Popup.',
          mockup: 'editing',
        },
        {
          Icon: Bell,
          color: 'bg-orange-50 text-orange-500',
          title: 'Täglicher Digest',
          desc: 'Jede verantwortliche Person erhält automatisch eine E-Mail-Zusammenfassung ihrer offenen Punkte – jeden Morgen.',
          mockup: 'digest',
        },
      ]

  // Compact feature list items (right side — 4 items)
  const featureListItems = isEn
    ? [
        { Icon: Link2, color: 'bg-purple-50 text-purple-500', title: 'Public REST API & Webhooks', desc: 'Integrate AutoToDo into any tool via REST API and outbound webhooks.' },
        { Icon: Users, color: 'bg-emerald-50 text-emerald-600', title: 'Team Collaboration', desc: 'Invite members with granular roles: viewer, editor, admin.' },
        { Icon: Download, color: 'bg-teal-50 text-teal-600', title: 'XLSX Export with Branding', desc: 'Export your action list as branded Excel file in one click.' },
        { Icon: FileText, color: 'bg-gray-50 text-gray-600', title: 'Notion Import', desc: 'Import meeting notes from Notion directly — connect once, import anytime.' },
      ]
    : [
        { Icon: Link2, color: 'bg-purple-50 text-purple-500', title: 'REST-API & Webhooks', desc: 'AutoToDo in beliebige Tools einbinden via REST-API und ausgehende Webhooks.' },
        { Icon: Users, color: 'bg-emerald-50 text-emerald-600', title: 'Team-Zusammenarbeit', desc: 'Mitglieder mit feingranularen Rollen einladen: Betrachter, Editor, Admin.' },
        { Icon: Download, color: 'bg-teal-50 text-teal-600', title: 'XLSX-Export mit Branding', desc: 'LOP als gebrandete Excel-Datei exportieren – per Klick.' },
        { Icon: FileText, color: 'bg-gray-50 text-gray-600', title: 'Notion-Import', desc: 'Meeting-Notizen direkt aus Notion importieren – einmal verbinden, jederzeit importieren.' },
      ]

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
          <ThemeToggle />
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

      {/* Features – 2-block layout */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
            {isEn ? 'Everything your team needs' : 'Alles, was Ihr Team braucht'}
          </h2>
          <p className="text-center text-gray-500 mb-12">
            {isEn ? 'Built for consulting teams, project managers and engineering leads.' : 'Entwickelt für Beratungsteams, Projektleiter und Engineering-Leads.'}
          </p>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: 3 Feature Highlights */}
            <div className="flex flex-col gap-5">
              {featureHighlights.map((f) => (
                <div key={f.title} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center shrink-0`}>
                      <f.Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base leading-tight">{f.title}</h3>
                      <p className="text-gray-500 text-sm mt-1 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                  {/* Inline HTML Mockup */}
                  {f.mockup === 'extraction' && (
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <span className="text-xs font-medium text-gray-500">
                          {isEn ? 'AI processing transcript…' : 'KI verarbeitet Transkript…'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { task: isEn ? 'Prepare Q3 roadmap' : 'Q3-Roadmap vorbereiten', owner: 'A. Fischer', due: '15.05.' },
                          { task: isEn ? 'Review budget proposal' : 'Budgetvorschlag prüfen', owner: 'M. Müller', due: '20.05.' },
                        ].map((row, i) => (
                          <div key={i} className="bg-white rounded-lg border border-gray-200 px-3 py-2 flex items-center gap-3 text-xs">
                            <span className="text-green-500 shrink-0">✓</span>
                            <span className="font-medium text-gray-800 flex-1">{row.task}</span>
                            <span className="text-gray-400 shrink-0">{row.owner}</span>
                            <span className="text-gray-400 shrink-0">{row.due}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-yellow-600 font-medium text-right">
                        {isEn ? '↑ extracted in 18 s' : '↑ extrahiert in 18 s'}
                      </div>
                    </div>
                  )}
                  {f.mockup === 'editing' && (
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mt-2">
                      <div className="bg-white rounded-lg border border-blue-300 ring-1 ring-blue-200 px-3 py-2.5 text-xs flex items-center gap-3">
                        <span className="font-medium text-gray-800 flex-1">{isEn ? 'Update customer contract' : 'Kundenvertrag aktualisieren'}</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium shrink-0">
                          {isEn ? 'In progress' : 'In Bearbeitung'}
                        </span>
                        <span className="text-blue-500 shrink-0 cursor-pointer">✎</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        {isEn ? 'Click any cell to edit inline' : 'Beliebige Zelle anklicken zum Bearbeiten'}
                      </p>
                    </div>
                  )}
                  {f.mockup === 'digest' && (
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mt-2">
                      <div className="bg-white rounded-xl border border-gray-200 p-3 text-xs">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs font-bold">M</div>
                          <span className="font-semibold text-gray-700">M. Müller</span>
                          <span className="ml-auto text-gray-400">07:00</span>
                        </div>
                        <p className="text-gray-600 font-medium mb-1">
                          {isEn ? 'Your open items today (3)' : 'Ihre offenen Punkte heute (3)'}
                        </p>
                        <ul className="space-y-0.5 text-gray-500">
                          <li>→ {isEn ? 'Prepare Q3 roadmap' : 'Q3-Roadmap vorbereiten'} <span className="text-red-400 font-medium">{isEn ? '· overdue' : '· überfällig'}</span></li>
                          <li>→ {isEn ? 'Review budget proposal' : 'Budgetvorschlag prüfen'}</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right: 4 compact feature list items */}
            <div className="flex flex-col gap-4 lg:pt-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                {isEn ? 'Also included' : 'Ebenfalls enthalten'}
              </p>
              {featureListItems.map((f) => (
                <div key={f.title} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-start gap-4 hover:shadow-sm hover:border-gray-300 transition-all duration-150">
                  <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <f.Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{f.title}</h3>
                    <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}

              {/* Security callout inside right column */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 px-5 py-4 flex items-start gap-4 mt-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {isEn ? 'GDPR-compliant & encrypted' : 'DSGVO-konform & verschlüsselt'}
                  </h3>
                  <p className="text-gray-600 text-sm mt-0.5 leading-relaxed">
                    {isEn
                      ? 'All transcripts encrypted at rest (AES-256-GCM). Data stays in your Supabase project.'
                      : 'Alle Transkripte verschlüsselt gespeichert (AES-256-GCM). Daten bleiben in Ihrem Supabase-Projekt.'}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <RefreshCw className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {isEn ? 'Status sync & audit log' : 'Status-Sync & Audit-Log'}
                  </h3>
                  <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">
                    {isEn
                      ? 'Every change is tracked. Full audit log available on Team and Business plans.'
                      : 'Jede Änderung wird protokolliert. Vollständiges Audit-Log ab Team- und Business-Plan.'}
                  </p>
                </div>
              </div>
            </div>
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

      {/* Desktop App */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-10 text-white overflow-hidden relative">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20 pointer-events-none" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-5 border border-white/10">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
                    <rect x="1" y="1" width="11" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M4 11h5M6.5 8v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  {isEn ? 'Native Desktop App' : 'Native Desktop-App'}
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  {isEn ? 'Record meetings directly — no upload needed.' : 'Meetings direkt aufnehmen – kein Upload nötig.'}
                </h2>
                <p className="text-white/70 mb-6 leading-relaxed text-sm">
                  {isEn
                    ? 'The AutoToDo Desktop App records your meeting audio locally, transcribes it with Whisper on your device, and updates your LOP automatically. Your audio never leaves your computer.'
                    : 'Die AutoToDo Desktop-App nimmt Meeting-Audio lokal auf, transkribiert es mit Whisper auf Ihrem Gerät und aktualisiert das LOP automatisch. Audio verlässt Ihren Computer nicht.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/desktop"
                    className="px-5 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                  >
                    {isEn ? 'Download Desktop App' : 'Desktop-App herunterladen'} →
                  </Link>
                </div>
                <p className="text-xs text-white/40 mt-3">macOS · Windows · {isEn ? 'Free' : 'Kostenlos'}</p>
              </div>
              <div className="hidden md:flex flex-col gap-2.5">
                {[
                  { icon: '🎙', title: isEn ? 'One-click recording per LOP' : 'Aufnahme per Klick je LOP-Liste', desc: isEn ? 'Start, pause, stop — directly in the project view.' : 'Start, Pause, Stop – direkt in der Projektansicht.' },
                  { icon: '🔒', title: isEn ? 'Local Whisper transcription' : 'Lokale Whisper-Transkription', desc: isEn ? 'Audio stays on your device. No cloud required.' : 'Audio bleibt auf Ihrem Gerät. Keine Cloud nötig.' },
                  { icon: '⚡', title: isEn ? 'Automatic LOP update' : 'Automatisches LOP-Update', desc: isEn ? 'AI extracts tasks and updates the list instantly.' : 'KI extrahiert Aufgaben und aktualisiert das LOP sofort.' },
                ].map(f => (
                  <div key={f.title} className="bg-white/8 rounded-xl px-4 py-3 flex items-start gap-3 border border-white/10">
                    <span className="text-xl mt-0.5">{f.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{f.title}</p>
                      <p className="text-xs text-white/60 mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection isEn={isEn} />

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
