# Offene Rechtsdaten – bitte manuell ausfüllen

## vencly GmbH – Pflichtangaben

| Feld                     | Status        | Wo einzutragen                                      |
|--------------------------|---------------|------------------------------------------------------|
| Telefonnummer            | ✅ entfernt   | Kein Telefon angegeben                               |
| USt-IdNr. (DE...)        | ✅ DE367131457 | `app/impressum/page.tsx` – eingetragen              |
| Starter-Preis in EUR     | ❌ TODO       | `app/agb/page.tsx`, `app/page.tsx` (Pricing)         |
| Pro-Preis in EUR         | ❌ TODO       | `app/agb/page.tsx`, `app/page.tsx` (Pricing)         |
| Supabase Serverstandort  | ✅ Frankfurt  | `app/datenschutz/page.tsx` – bereits eingetragen     |
| Zahlungsanbieter         | ❌ TODO       | `app/datenschutz/page.tsx` (Auftragsverarbeiter)     |
| AGB-Datum (Stand:)       | ✅ März 2026  | `app/agb/page.tsx` – bereits eingetragen             |
| DSE-Datum (Stand:)       | ✅ März 2026  | `app/datenschutz/page.tsx` – bereits eingetragen     |

## Bereits bekannte Daten (aus Handelsregister / vencly.com/impressum)

- Firma: vencly GmbH
- Adresse: Leopoldstraße 31, 80802 München
- Geschäftsführer: Clemens Eugen Theodor Pompeÿ
- HRB: 290524, Amtsgericht München
- E-Mail allgemein: hello@vencly.com
- Datenschutz-E-Mail: datenschutz@vencly.com
- Aufsichtsbehörde: BayLDA, Promenade 18, 91522 Ansbach (www.lda.bayern.de)
- Zuständiges Gericht: Amtsgericht München (Gerichtsstand)

## Wo TODO-Marker zu finden sind

Alle Pflichtfelder, die noch fehlen, sind im Code mit `[TODO – ...]` markiert
und erscheinen in der UI in **gelber Schrift** (Klasse `text-amber-600`).

Suche im Projekt nach allen offenen Stellen:

```bash
grep -r "\[TODO" app/agb app/datenschutz app/impressum app/datensicherheit
```

## Rechtlicher Hinweis

Diese Seiten wurden nach bestem Wissen erstellt.
Für eine abschließende rechtsverbindliche Prüfung wird die Konsultation
eines auf IT-Recht spezialisierten Rechtsanwalts empfohlen.
