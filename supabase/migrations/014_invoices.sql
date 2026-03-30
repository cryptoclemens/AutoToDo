-- Migration 014: Rechnungstabelle für Mollie-Zahlungen
-- Speichert fortlaufende Rechnungsnummern und Zahlungsdetails

CREATE TABLE IF NOT EXISTS invoices (
  id              SERIAL PRIMARY KEY,
  invoice_number  TEXT UNIQUE NOT NULL,     -- z.B. RE-2026-00001
  payment_id      TEXT UNIQUE NOT NULL,     -- Mollie payment ID
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email  TEXT NOT NULL,
  customer_name   TEXT NOT NULL,
  plan            TEXT NOT NULL,
  amount_gross    NUMERIC(10,2) NOT NULL,   -- Brutto (was Mollie belastet)
  vat_rate        NUMERIC(5,2) NOT NULL DEFAULT 19.00,
  amount_net      NUMERIC(10,2) NOT NULL,
  amount_vat      NUMERIC(10,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'EUR',
  issued_at       TIMESTAMPTZ DEFAULT now(),
  sent_at         TIMESTAMPTZ               -- wann E-Mail verschickt wurde
);

-- Index für schnelle Lookups
CREATE INDEX IF NOT EXISTS idx_invoices_workspace_id ON invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON invoices(payment_id);

-- RLS: Admins sehen ihre eigenen Workspace-Rechnungen
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_service_role" ON invoices
  FOR ALL USING (true);
