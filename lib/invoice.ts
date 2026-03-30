/**
 * Invoice generation and email delivery for Mollie payments.
 *
 * Invoices are HTML emails sent via Resend. They are legally compliant
 * with §14 UStG (German invoice requirements):
 * - Fortlaufende Rechnungsnummer
 * - Leistungsdatum
 * - Nettobetrag, MwSt-Satz, MwSt-Betrag, Bruttobetrag
 * - Angaben zu Leistungserbringer und -empfänger
 *
 * Seller info is configurable via environment variables:
 *   INVOICE_COMPANY_NAME  (default: AutoToDo / Vencly GmbH)
 *   INVOICE_COMPANY_ADDRESS
 *   INVOICE_COMPANY_CITY
 *   INVOICE_COMPANY_TAX_ID  (Steuernummer oder USt-ID)
 *   INVOICE_COMPANY_EMAIL
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { PLAN_NAMES } from './plans'
import type { Plan } from './plans'

const VAT_RATE = 19 // Prozent

/** Generate a sequential invoice number: RE-YYYY-NNNNN */
export async function generateInvoiceNumber(supabase: SupabaseClient): Promise<string> {
  const year = new Date().getFullYear()
  // Count invoices issued this year to get next sequence
  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .gte('issued_at', `${year}-01-01T00:00:00Z`)
    .lt('issued_at', `${year + 1}-01-01T00:00:00Z`)

  const seq = ((count ?? 0) + 1).toString().padStart(5, '0')
  return `RE-${year}-${seq}`
}

interface InvoiceData {
  invoiceNumber: string
  paymentId: string
  plan: Plan
  amountGross: number
  currency: string
  customerName: string
  customerEmail: string
  workspaceName: string
  issuedAt: Date
}

function sellerInfo() {
  return {
    name: process.env.INVOICE_COMPANY_NAME ?? 'AutoToDo · Vencly',
    address: process.env.INVOICE_COMPANY_ADDRESS ?? '',
    city: process.env.INVOICE_COMPANY_CITY ?? '',
    taxId: process.env.INVOICE_COMPANY_TAX_ID ?? '',
    email: process.env.INVOICE_COMPANY_EMAIL ?? 'billing@vencly.com',
  }
}

export function buildInvoiceHtml(data: InvoiceData): string {
  const { invoiceNumber, paymentId, plan, amountGross, currency, customerName, customerEmail, workspaceName, issuedAt } = data
  const seller = sellerInfo()

  const net = amountGross / (1 + VAT_RATE / 100)
  const vat = amountGross - net
  const fmt = (n: number) => n.toFixed(2).replace('.', ',')
  const currencySymbol = currency === 'EUR' ? '€' : currency

  const dateStr = issuedAt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const planName = PLAN_NAMES[plan] ?? plan

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 14px; color: #1a1a1a; margin: 0; padding: 0; background: #f5f5f5; }
  .wrapper { max-width: 680px; margin: 32px auto; background: #fff; padding: 48px; border-radius: 8px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { font-size: 22px; font-weight: 700; color: #2563EB; }
  .invoice-meta { text-align: right; color: #555; font-size: 13px; }
  .invoice-meta .invoice-number { font-size: 16px; font-weight: 700; color: #1a1a1a; }
  .parties { display: flex; gap: 48px; margin-bottom: 40px; }
  .party h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin: 0 0 8px; }
  .party p { margin: 2px 0; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; padding: 8px 0; border-bottom: 2px solid #e5e7eb; }
  td { padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  .amount { text-align: right; }
  .totals { margin-left: auto; width: 260px; }
  .totals tr td { font-size: 13px; padding: 4px 0; }
  .totals tr.gross td { font-size: 16px; font-weight: 700; padding-top: 12px; border-top: 2px solid #1a1a1a; border-bottom: none; }
  .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #888; }
  .paid-badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 24px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div>
      <div class="brand">AutoToDo</div>
      ${seller.address ? `<div style="color:#555;font-size:13px;margin-top:4px">${seller.name}<br>${seller.address}<br>${seller.city}</div>` : ''}
    </div>
    <div class="invoice-meta">
      <div class="invoice-number">Rechnung ${invoiceNumber}</div>
      <div>Datum: ${dateStr}</div>
      <div>Leistungszeitraum: ${dateStr}</div>
    </div>
  </div>

  <span class="paid-badge">✓ Bezahlt</span>

  <div class="parties">
    <div class="party">
      <h3>Rechnungssteller</h3>
      <p><strong>${seller.name}</strong></p>
      ${seller.address ? `<p>${seller.address}</p><p>${seller.city}</p>` : ''}
      ${seller.taxId ? `<p>USt-ID / St-Nr.: ${seller.taxId}</p>` : ''}
      <p>${seller.email}</p>
    </div>
    <div class="party">
      <h3>Rechnungsempfänger</h3>
      <p><strong>${customerName}</strong></p>
      <p>${workspaceName}</p>
      <p>${customerEmail}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Beschreibung</th>
        <th class="amount">Betrag (netto)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>AutoToDo ${planName} – Monatliches Abonnement</strong><br>
          <span style="color:#555;font-size:12px">Workspace: ${workspaceName} · Zahlungsreferenz: ${paymentId}</span>
        </td>
        <td class="amount">${currencySymbol} ${fmt(net)}</td>
      </tr>
    </tbody>
  </table>

  <table class="totals">
    <tr>
      <td>Nettobetrag</td>
      <td class="amount">${currencySymbol} ${fmt(net)}</td>
    </tr>
    <tr>
      <td>MwSt. ${VAT_RATE}%</td>
      <td class="amount">${currencySymbol} ${fmt(vat)}</td>
    </tr>
    <tr class="gross">
      <td>Gesamtbetrag</td>
      <td class="amount">${currencySymbol} ${fmt(amountGross)}</td>
    </tr>
  </table>

  <div class="footer">
    <p>Zahlung erfolgt via Mollie Payments. Diese Rechnung wurde automatisch erstellt und ist ohne Unterschrift gültig.</p>
    ${seller.taxId ? `<p>Steuernummer / USt-ID: ${seller.taxId}</p>` : ''}
  </div>
</div>
</body>
</html>`
}

/** Create invoice record in DB and send via Resend. */
export async function createAndSendInvoice(
  supabase: SupabaseClient,
  params: {
    paymentId: string
    workspaceId: string
    userId: string
    plan: Plan
    amountGross: number
    currency: string
  }
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return // E-Mail nicht konfiguriert → überspringen

  // Kundendaten laden
  const [{ data: ws }, { data: { user } }] = await Promise.all([
    supabase.from('workspaces').select('name').eq('id', params.workspaceId).single(),
    supabase.auth.admin.getUserById(params.userId),
  ])

  const customerEmail = user?.email ?? ''
  const customerName = (user?.user_metadata?.full_name as string | undefined) ?? customerEmail
  const workspaceName = (ws as { name: string } | null)?.name ?? 'Unbekannter Workspace'

  const invoiceNumber = await generateInvoiceNumber(supabase)
  const issuedAt = new Date()
  const net = params.amountGross / (1 + VAT_RATE / 100)
  const vat = params.amountGross - net

  // Rechnung in DB speichern
  await supabase.from('invoices').insert({
    invoice_number: invoiceNumber,
    payment_id: params.paymentId,
    workspace_id: params.workspaceId,
    user_id: params.userId,
    customer_email: customerEmail,
    customer_name: customerName,
    plan: params.plan,
    amount_gross: params.amountGross,
    vat_rate: VAT_RATE,
    amount_net: parseFloat(net.toFixed(2)),
    amount_vat: parseFloat(vat.toFixed(2)),
    currency: params.currency,
    issued_at: issuedAt.toISOString(),
  })

  const html = buildInvoiceHtml({
    invoiceNumber,
    paymentId: params.paymentId,
    plan: params.plan,
    amountGross: params.amountGross,
    currency: params.currency,
    customerName,
    customerEmail,
    workspaceName,
    issuedAt,
  })

  // Via Resend verschicken
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? 'AutoToDo <noreply@vencly.com>',
      to: [customerEmail],
      subject: `Rechnung ${invoiceNumber} – AutoToDo`,
      html,
    }),
  })

  if (res.ok) {
    // Sendzeitpunkt vermerken
    await supabase
      .from('invoices')
      .update({ sent_at: new Date().toISOString() })
      .eq('invoice_number', invoiceNumber)
  } else {
    console.error('Invoice email send failed', await res.text())
  }
}
