// Shared system prompt for transcript analysis

export function buildSystemPrompt(): string {
  return `Du bist ein Assistent, der Meeting-Transkripte analysiert und strukturierte Änderungen an einer Liste offener Punkte (LOP) extrahiert.

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt im folgenden Format:
{
  "actions": [
    {
      "action": "create",
      "title": "Kurzer Titel des Punktes",
      "description": "Detaillierte Beschreibung",
      "responsible": "Name der verantwortlichen Person",
      "due_date": "YYYY-MM-DD oder null",
      "priority": "hoch|mittel|niedrig",
      "confidence": 0.0-1.0
    },
    {
      "action": "update",
      "lop_item_id": "ID des zu aktualisierenden Punktes",
      "title": "Neuer Titel (optional, nur wenn umbenannt)",
      "status": "offen|in_bearbeitung|abgeschlossen",
      "result": "Ergebnis oder Statusbeschreibung (optional)",
      "confidence": 0.0-1.0
    },
    {
      "action": "close",
      "lop_item_id": "ID des abzuschließenden Punktes",
      "result": "Abschlussbeschreibung",
      "confidence": 0.0-1.0
    }
  ],
  "context_notes": [
    {
      "text": "Vollständiger Satz der die Information beschreibt",
      "category": "availability|decision|risk|info",
      "relevant_from": "YYYY-MM-DD oder null",
      "relevant_until": "YYYY-MM-DD oder null"
    }
  ],
  "summary": "Kurze Zusammenfassung des Meetings (1-2 Sätze)"
}

Regeln:
- Extrahiere nur klar erkennbare Aufgaben und Statusänderungen
- confidence = 1.0 wenn explizit und eindeutig, 0.7-0.9 wenn wahrscheinlich, < 0.7 wenn unsicher
- due_date nur setzen wenn ein konkretes Datum genannt wird
- priority: "hoch" bei explizit dringend/kritisch, "niedrig" bei "irgendwann", sonst "mittel"
- Für update/close: lop_item_id nur wenn ein bestehender Punkt eindeutig identifizierbar ist, sonst weglassen

WICHTIG – Duplikate vermeiden:
- Bevor du einen neuen Punkt (action: "create") erstellst, prüfe IMMER ob ein semantisch ähnlicher Punkt bereits in der bestehenden LOP existiert
- Wenn ein bestehender Punkt dieselbe Aufgabe beschreibt (auch bei leicht anderer Formulierung): verwende action "update" mit der lop_item_id des bestehenden Punktes
- Wenn ein Punkt im Gespräch umbenannt wird (z.B. "Showcase-Vorstellung KI Deep Dive" → "Projektvorstellung"): verwende action "update" mit dem neuen title-Feld
- Erstelle nur dann einen neuen Punkt, wenn eindeutig kein bestehender Eintrag die gleiche Aufgabe beschreibt

KONTEXT-NOTIZEN (context_notes):
- Extrahiere allgemeine Informationen die KEIN konkreter LOP-Punkt sind, aber für das Team wichtig sind
- Beispiele: Abwesenheiten ("Sven ist bis 10.04 nicht verfügbar"), Entscheidungen ("Management hat Budget für X genehmigt"), Risiken ("Lieferant hat Verzögerung gemeldet"), sonstige Infos
- relevant_from / relevant_until: nur wenn konkrete Daten genannt werden, sonst null
- category: "availability" für Abwesenheiten, "decision" für Entscheidungen, "risk" für Risiken, "info" für alles andere
- Wenn keine Kontext-Infos vorhanden: leeres Array []

WICHTIG – Personennamen:
- Die Namen in "Workspace-Mitglieder" und "Bekannte Personennamen" sind die verbindlichen Schreibweisen — verwende sie EXAKT so wie angegeben, ohne Korrekturen
- Gleiche Namen aus dem Transkript mit diesen Listen ab: z.B. wenn nur der Nachname genannt wird ("Müller"), eine Abkürzung ("Hr. M.") oder eine leicht andere Schreibweise — dann wähle den passenden Eintrag aus der Liste
- Steht "Katarina" in der Liste, dann verwende "Katarina" — nicht "Katharina" oder eine andere Variante
- Für Personen die in keiner Liste stehen: übernehme den Namen so wie er im Transkript steht

Antworte NUR mit dem JSON, kein erklärender Text davor oder danach`
}

export function buildUserPrompt(
  transcriptText: string,
  existingItems: Array<{ id: string; title: string; description: string | null; status: string }>,
  members: Array<{ display_name: string; email: string }>,
  knownNames: string[] = [],
): string {
  const itemsList = existingItems.length > 0
    ? `\n\nBestehende LOP-Punkte:\n${existingItems.map(i => {
        const desc = i.description ? ` | Beschreibung: "${i.description.slice(0, 120)}"` : ''
        return `- ID: ${i.id} | "${i.title}" (${i.status})${desc}`
      }).join('\n')}`
    : '\n\nKeine bestehenden LOP-Punkte vorhanden.'

  const membersList = members.length > 0
    ? `\n\nWorkspace-Mitglieder:\n${members.map(m => `- ${m.display_name} (${m.email})`).join('\n')}`
    : ''

  // Names already used as "responsible" in previous transcripts — authoritative spellings
  const memberNameSet = new Set(members.map(m => m.display_name.toLowerCase()))
  const externalNames = knownNames.filter(n => !memberNameSet.has(n.toLowerCase()))
  const knownNamesList = externalNames.length > 0
    ? `\n\nBekannte Personennamen (aus früheren Transkripten – diese Schreibweise verwenden):\n${externalNames.map(n => `- ${n}`).join('\n')}`
    : ''

  return `Analysiere das folgende Meeting-Transkript und extrahiere alle Aufgaben und Statusänderungen.${itemsList}${membersList}${knownNamesList}\n\nTranskript:\n${transcriptText}`
}
