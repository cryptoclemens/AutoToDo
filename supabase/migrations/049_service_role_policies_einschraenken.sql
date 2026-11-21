-- 049: Richtlinien "*_service_role" auf die Rolle service_role beschränken
--
-- Gefunden am 21.11.2026 beim Serverumzug: feedback_service_role, api_keys_service_role
-- und invoices_service_role waren als "FOR ALL USING (true)" ohne TO-Klausel angelegt
-- (Migration 007 u. a.), galten also für die Rolle public = auch anon. Damit konnte
-- jeder ohne Schlüssel über /rest/v1 diese Tabellen lesen, ändern und löschen
-- (Kong prüft auf /rest/v1 keinen API-Key).
--
-- service_role hat BYPASSRLS und braucht die Richtlinien gar nicht; die Einschränkung
-- ändert für App, Watchtower-Bot und Admin-Routen (alle mit Service-Key) nichts.
-- Auf der Produktiv-DB (pompey) bereits am 21.11.2026 14:10 von Hand eingespielt;
-- ALTER POLICY ist wiederholbar.
ALTER POLICY feedback_service_role ON public.feedback TO service_role;
ALTER POLICY api_keys_service_role ON public.api_keys TO service_role;
ALTER POLICY invoices_service_role ON public.invoices TO service_role;
