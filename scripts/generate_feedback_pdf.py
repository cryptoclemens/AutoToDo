"""
Generates a PDF explaining the AutoToDo-style AI-assisted feedback process.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.platypus.flowables import Flowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

PAGE_W, PAGE_H = A4
BRAND   = HexColor('#2563eb')  # blue-600
BRAND2  = HexColor('#1e40af')  # blue-800
GRAY50  = HexColor('#f8fafc')
GRAY100 = HexColor('#f1f5f9')
GRAY200 = HexColor('#e2e8f0')
GRAY400 = HexColor('#94a3b8')
GRAY600 = HexColor('#475569')
GRAY800 = HexColor('#1e293b')
GREEN   = HexColor('#16a34a')
AMBER   = HexColor('#d97706')
PURPLE  = HexColor('#7c3aed')
TEAL    = HexColor('#0d9488')

def make_styles():
    base = getSampleStyleSheet()

    def ps(name, **kw):
        return ParagraphStyle(name, **kw)

    return {
        'h1': ps('h1', fontSize=22, leading=28, textColor=GRAY800,
                 fontName='Helvetica-Bold', spaceAfter=2*mm),
        'h2': ps('h2', fontSize=13, leading=18, textColor=BRAND2,
                 fontName='Helvetica-Bold', spaceBefore=5*mm, spaceAfter=2*mm),
        'h3': ps('h3', fontSize=10, leading=14, textColor=GRAY800,
                 fontName='Helvetica-Bold', spaceBefore=3*mm, spaceAfter=1*mm),
        'body': ps('body', fontSize=9.5, leading=15, textColor=GRAY600,
                   fontName='Helvetica', spaceAfter=2*mm, alignment=TA_JUSTIFY),
        'small': ps('small', fontSize=8.5, leading=13, textColor=GRAY600,
                    fontName='Helvetica'),
        'caption': ps('caption', fontSize=8, leading=12, textColor=GRAY400,
                      fontName='Helvetica', alignment=TA_CENTER),
        'code': ps('code', fontSize=8.5, leading=13, textColor=GRAY800,
                   fontName='Courier', backColor=GRAY100, leftIndent=4*mm,
                   borderPad=3, spaceBefore=2*mm, spaceAfter=2*mm),
        'mono_center': ps('mono_c', fontSize=8, leading=12, textColor=GRAY800,
                          fontName='Courier', alignment=TA_CENTER),
        'label': ps('label', fontSize=8, leading=11, textColor=white,
                    fontName='Helvetica-Bold', alignment=TA_CENTER),
        'sub': ps('sub', fontSize=7.5, leading=10, textColor=GRAY400,
                  fontName='Helvetica', alignment=TA_CENTER),
        'tag': ps('tag', fontSize=7.5, leading=10, textColor=white,
                  fontName='Helvetica-Bold', alignment=TA_CENTER),
    }


# ── Custom Flowables ──────────────────────────────────────────────────────────

class RoundRect(Flowable):
    """Filled rounded rectangle — used as step boxes in the flow diagram."""
    def __init__(self, w, h, radius, fill, label, sublabel='', label_style=None, sub_style=None):
        super().__init__()
        self.width = w; self.height = h; self.radius = radius
        self.fill = fill; self.label = label; self.sublabel = sublabel
        self.label_style = label_style; self.sub_style = sub_style

    def draw(self):
        c = self.canv
        c.setFillColor(self.fill)
        c.setStrokeColor(self.fill)
        c.roundRect(0, 0, self.width, self.height, self.radius, fill=1, stroke=0)
        # label
        if self.label:
            from reportlab.platypus import Paragraph
            p = Paragraph(self.label, self.label_style)
            pw, ph = p.wrap(self.width - 6*mm, self.height)
            p.drawOn(c, 3*mm, self.height/2 - ph/2 + (3 if self.sublabel else 0))
        if self.sublabel:
            p2 = Paragraph(self.sublabel, self.sub_style)
            pw2, ph2 = p2.wrap(self.width - 6*mm, self.height)
            p2.drawOn(c, 3*mm, self.height/2 - ph2/2 - 6)


class Arrow(Flowable):
    """Vertical arrow connecting two flow steps."""
    def __init__(self, w=5*mm, h=8*mm, color=GRAY200):
        super().__init__()
        self.width = w; self.height = h; self.color = color

    def draw(self):
        c = self.canv
        c.setStrokeColor(self.color)
        c.setFillColor(self.color)
        c.setLineWidth(1.5)
        cx = self.width / 2
        c.line(cx, self.height, cx, 4)
        # arrowhead
        c.setLineWidth(0)
        path = c.beginPath()
        path.moveTo(cx, 0)
        path.lineTo(cx - 3, 5)
        path.lineTo(cx + 3, 5)
        path.close()
        c.drawPath(path, fill=1, stroke=0)


class InfoBox(Flowable):
    """Colored info box with left accent bar."""
    def __init__(self, text, width, bg, bar, style):
        super().__init__()
        self._text = text; self.width = width
        self._bg = bg; self._bar = bar; self._style = style
        self._pad = 4*mm

    def wrap(self, w, h):
        from reportlab.platypus import Paragraph
        inner = self.width - 2*self._pad - 3*mm
        p = Paragraph(self._text, self._style)
        _, ph = p.wrap(inner, 9999)
        self.height = ph + 2*self._pad
        return self.width, self.height

    def draw(self):
        from reportlab.platypus import Paragraph
        c = self.canv
        c.setFillColor(self._bg)
        c.rect(0, 0, self.width, self.height, fill=1, stroke=0)
        c.setFillColor(self._bar)
        c.rect(0, 0, 3*mm, self.height, fill=1, stroke=0)
        inner = self.width - 2*self._pad - 3*mm
        p = Paragraph(self._text, self._style)
        pw, ph = p.wrap(inner, 9999)
        p.drawOn(c, 3*mm + self._pad, self.height/2 - ph/2)


# ── Flow Diagram (standalone, drawn in canvas) ────────────────────────────────

class FlowDiagram(Flowable):
    """
    Horizontal 5-step flow diagram.
    Steps: User → API → GitHub → Claude → Features
    """
    def __init__(self, width):
        super().__init__()
        self.width = width
        self.height = 52*mm

    def draw(self):
        c = self.canv
        W = self.width
        H = self.height

        steps = [
            ('💬', 'Nutzer', 'Feedback-Button', BRAND),
            ('⚙️', 'API', 'POST /api/feedback', TEAL),
            ('📄', 'GitHub', 'feedback.md\ncommit', PURPLE),
            ('🤖', 'Claude', 'Session-Start\nliest + priorisiert', AMBER),
            ('🚀', 'Features', 'Implementierung\n+ Release', GREEN),
        ]
        n = len(steps)
        box_w = 28*mm
        gap   = (W - n * box_w) / (n + 1)
        box_h = 28*mm
        y_box = H - box_h - 2*mm
        y_lbl = y_box - 7*mm

        for i, (icon, title, sub, color) in enumerate(steps):
            x = gap + i * (box_w + gap)

            # drop shadow
            c.setFillColor(GRAY200)
            c.roundRect(x + 1, y_box - 1, box_w, box_h, 4*mm, fill=1, stroke=0)

            # box
            c.setFillColor(color)
            c.roundRect(x, y_box, box_w, box_h, 4*mm, fill=1, stroke=0)

            # icon
            c.setFont('Helvetica', 16)
            c.setFillColor(white)
            c.drawCentredString(x + box_w/2, y_box + box_h/2 + 1, icon)

            # title under box
            c.setFont('Helvetica-Bold', 8)
            c.setFillColor(GRAY800)
            c.drawCentredString(x + box_w/2, y_lbl, title)

            # sub under title
            for j, line in enumerate(sub.split('\n')):
                c.setFont('Helvetica', 7)
                c.setFillColor(GRAY400)
                c.drawCentredString(x + box_w/2, y_lbl - 9 - j*9, line)

            # arrow to next
            if i < n - 1:
                ax = x + box_w + 2*mm
                ay = y_box + box_h/2
                arrow_w = gap - 4*mm
                # line
                c.setStrokeColor(GRAY200)
                c.setLineWidth(1.5)
                c.line(ax, ay, ax + arrow_w, ay)
                # arrowhead
                c.setFillColor(GRAY400)
                c.setLineWidth(0)
                path = c.beginPath()
                path.moveTo(ax + arrow_w + 4, ay)
                path.lineTo(ax + arrow_w - 2, ay + 3)
                path.lineTo(ax + arrow_w - 2, ay - 3)
                path.close()
                c.drawPath(path, fill=1, stroke=0)

        # step numbers
        for i in range(n):
            x = gap + i * (box_w + gap)
            c.setFillColor(white)
            c.setLineWidth(0)
            c.circle(x + 7*mm, y_box + box_h - 7*mm, 4.5, fill=1, stroke=0)
            c.setFont('Helvetica-Bold', 7)
            c.setFillColor(steps[i][3])
            c.drawCentredString(x + 7*mm, y_box + box_h - 7*mm - 2.5, str(i+1))


# ── Document Assembly ─────────────────────────────────────────────────────────

def build_pdf(out_path):
    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=18*mm,
        rightMargin=18*mm,
        topMargin=16*mm,
        bottomMargin=16*mm,
        title='AI-Assisted Feedback Process',
        author='AutoToDo / Vencly',
    )

    S = make_styles()
    story = []
    usable_w = PAGE_W - 36*mm

    # ── Header ────────────────────────────────────────────────────────────────
    story.append(Paragraph('AI-gestützter Feedback-Prozess', S['h1']))
    story.append(Paragraph(
        'Wie Nutzer-Feedback direkt in Features wird – ohne Ticket-System, ohne Meetings.',
        S['body']))
    story.append(HRFlowable(width=usable_w, thickness=1, color=GRAY200, spaceAfter=4*mm))

    # ── Flow Diagram ──────────────────────────────────────────────────────────
    story.append(Paragraph('Der Prozess auf einen Blick', S['h2']))
    story.append(FlowDiagram(usable_w))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        'Von der Eingabe bis zum Feature dauert es typischerweise eine Session (< 2 h).',
        S['caption']))
    story.append(Spacer(1, 5*mm))

    # ── Step-by-step ──────────────────────────────────────────────────────────
    story.append(Paragraph('Schritt für Schritt', S['h2']))

    steps = [
        (BRAND,  '1',  '💬  Schritt 1 – Nutzer sendet Feedback',
         'Der eingeloggte Nutzer klickt den <b>Feedback-Button</b> (fixed, '
         'unten links in der App) und wählt eine Kategorie: '
         '<i>Fehler · Feature-Wunsch · Allgemein · Sonstiges</i>. '
         'Die Eingabe ist auf 2.000 Zeichen begrenzt.'),
        (TEAL,   '2',  '⚙️  Schritt 2 – API speichert & versioniert',
         'Der POST-Request landet bei <b>/api/feedback</b>. Die API speichert den '
         'Eintrag parallel in zwei Wegen: (a) in die Supabase-Datenbank '
         '(Tabelle <i>feedback</i>, mit workspace_id + user_id) und (b) als '
         '<b>Git-Commit</b> direkt in die Datei <i>feedback.md</i> im Repository – '
         'via GitHub Contents API. Jeder Eintrag bekommt eine fortlaufende ID '
         '(F-001, B-002 …).'),
        (PURPLE, '3',  '📄  Schritt 3 – feedback.md im Repository',
         'Die Datei ist eine strukturierte Markdown-Datei mit einem '
         'Eintrag pro Feedback. Format: <b>ID | Timestamp | Kategorie</b>, '
         'Workspace, Nutzer-E-Mail, Nachricht. Gelöste Einträge bekommen den '
         'Marker <i>Status: bearbeitet</i>. So ist der komplette '
         'Feedback-Verlauf versioniert und nachvollziehbar.'),
        (AMBER,  '4',  '🤖  Schritt 4 – Claude liest & priorisiert',
         'Beim nächsten Session-Start liest Claude die feedback.md automatisch '
         'aus (über den Kontext-Inject oder manuell per "Gibt es neues Feedback?"). '
         'Claude priorisiert nach Häufigkeit, Workspace-Relevanz und technischer '
         'Machbarkeit – und schlägt vor, welche Punkte er als nächstes umsetzt.'),
        (GREEN,  '5',  '🚀  Schritt 5 – Implementierung & Release',
         'Claude implementiert das Feature direkt im Repo, erstellt einen '
         'Commit und pusht auf den Development-Branch. Der GitHub Actions '
         'Workflow deployed automatisch auf den Produktiv-Server. '
         'Abschließend wird der Feedback-Eintrag auf <i>Status: bearbeitet</i> '
         'gesetzt und ein Update-Eintrag in <b>DashboardUpdates.tsx</b> '
         'veröffentlicht – sichtbar für alle Nutzer im Dashboard.'),
    ]

    for color, num, title, desc in steps:
        # Colored title bar
        tbl = Table([[Paragraph(title, S['label'])]], colWidths=[usable_w])
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), color),
            ('ROUNDEDCORNERS', [3*mm]),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(tbl)
        story.append(Paragraph(desc, S['body']))
        story.append(Spacer(1, 2*mm))

    story.append(HRFlowable(width=usable_w, thickness=1, color=GRAY200,
                             spaceBefore=4*mm, spaceAfter=4*mm))

    # ── What you need ─────────────────────────────────────────────────────────
    story.append(Paragraph('Was du brauchst', S['h2']))

    reqs = [
        ('GitHub-Repo', 'Ein Repository, in dem Claude Commits machen darf (Schreib-Zugriff).'),
        ('GITHUB_FEEDBACK_TOKEN', 'Personal Access Token mit Scope <i>repo</i> (read + write contents). '
         'Als Env-Variable hinterlegen: <b>GITHUB_FEEDBACK_TOKEN</b>.'),
        ('GITHUB_FEEDBACK_BRANCH', 'Der Branch, auf den Feedback-Commits landen (z.B. <i>main</i> oder '
         '<i>feedback</i>). Default: main.'),
        ('feedback.md', 'Die Zieldatei im Repo-Root. Kann leer anlegen – die API erstellt den '
         'Header automatisch beim ersten Commit.'),
        ('Claude Code Zugang', 'Claude muss das Repo lesen können. Am einfachsten: Claude Code '
         'CLI / Claude Code Web mit Repo-Zugriff.'),
    ]

    table_data = [
        [Paragraph('<b>Komponente</b>', S['small']),
         Paragraph('<b>Beschreibung</b>', S['small'])]
    ] + [
        [Paragraph(k, S['small']), Paragraph(v, S['small'])]
        for k, v in reqs
    ]
    tbl2 = Table(table_data, colWidths=[40*mm, usable_w - 40*mm])
    tbl2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BRAND),
        ('TEXTCOLOR', (0,0), (-1,0), white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, GRAY50]),
        ('GRID', (0,0), (-1,-1), 0.3, GRAY200),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(tbl2)
    story.append(Spacer(1, 5*mm))

    # ── Muster-Prompt ─────────────────────────────────────────────────────────
    story.append(Paragraph('Muster-Prompt: Session-Start mit Feedback-Check', S['h2']))
    story.append(Paragraph(
        'Diesen Prompt kannst du in dein <b>CLAUDE.md</b> eintragen – '
        'Claude liest ihn bei jedem Session-Start und weiß automatisch, '
        'was zu tun ist:', S['body']))

    prompt_text = '''\
## Feedback-Prozess

Beim Session-Start immer zuerst feedback.md lesen und prüfen, ob es neue
Einträge gibt (kein "Status: bearbeitet"-Marker).

Neue Einträge priorisieren:
  - 🐛 Fehler (B-xxx) → sofort ansprechen
  - ✨ Feature-Wunsch (F-xxx) → nach Häufigkeit / Aufwand abwägen
  - 💬 Allgemein (G-xxx) → ggf. nur bestätigen

Nach der Implementierung:
  1. Feedback-Eintrag in feedback.md mit "Status: bearbeitet" markieren
     und eine **Lösung:** Zeile ergänzen (1 Satz, was umgesetzt wurde)
  2. Neuen Eintrag in DashboardUpdates.tsx (UPDATES-Array) ergänzen
     mit ID, Datum, kurzem Titel und nutzerorientierter Beschreibung
  3. Commit + Push auf den Development-Branch

Format neuer Feedback-Einträge in feedback.md:
  ## F-XXX | YYYY-MM-DD HH:MM:SS | ✨ Feature-Wunsch
  **Workspace:** MeinProjekt
  **Nutzer:** user@example.com

  [Nachricht des Nutzers]

  ---'''

    # monospaced box
    code_style = ParagraphStyle('codeblock',
        fontSize=7.8, leading=12, textColor=GRAY800,
        fontName='Courier', backColor=GRAY100,
        leftIndent=0, rightIndent=0,
        borderPad=5)
    # Replace newlines with <br/> for Paragraph
    prompt_html = prompt_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>')
    tbl3 = Table([[Paragraph(prompt_html, code_style)]], colWidths=[usable_w])
    tbl3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), GRAY100),
        ('BOX', (0,0), (-1,-1), 0.5, GRAY200),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(tbl3)
    story.append(Spacer(1, 5*mm))

    # ── Tipps ─────────────────────────────────────────────────────────────────
    story.append(Paragraph('Tipps aus der Praxis', S['h2']))
    tips = [
        ('<b>Kleiner Button, große Wirkung.</b> Der Feedback-Button ist fixed unten links '
         'platziert – immer erreichbar, nie im Weg. Nutzer senden Feedback genau dann, '
         'wenn etwas auffällt.', BRAND),
        ('<b>Git als Single Source of Truth.</b> feedback.md liegt im Repo – '
         'Claude sieht es ohne extra Tooling. Kein Jira, kein Trello, kein Webhook nötig.', TEAL),
        ('<b>Denormalisierter Kontext.</b> Workspace-Name und E-Mail direkt im Eintrag '
         'speichern (nicht nur IDs). Claude muss keine Joins machen.', PURPLE),
        ('<b>Resilient by design.</b> API speichert immer in beide Wege (DB + GitHub). '
         'Wenn einer fehlschlägt, landet das Feedback trotzdem irgendwo.', AMBER),
        ('<b>Transparenz für Nutzer.</b> Dashboard-Updates-Sektion zeigt pro Eintrag Titel, '
         'Datum und Beschreibung – Nutzer sehen, dass ihr Feedback ankommt.', GREEN),
    ]

    for tip_text, color in tips:
        ib = InfoBox(
            tip_text,
            usable_w,
            bg=HexColor(hex(color.__int__()).replace('0x', '#').ljust(9, '0') + '18') if False else GRAY50,
            bar=color,
            style=ParagraphStyle('tip', fontSize=8.5, leading=13, textColor=GRAY600,
                                  fontName='Helvetica')
        )
        story.append(ib)
        story.append(Spacer(1, 2*mm))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width=usable_w, thickness=1, color=GRAY200,
                             spaceBefore=6*mm, spaceAfter=3*mm))
    story.append(Paragraph(
        'Erstellt mit AutoToDo · vencly.com &nbsp;|&nbsp; '
        'Der vollständige Quellcode ist auf GitHub verfügbar.',
        ParagraphStyle('footer', fontSize=7.5, leading=11, textColor=GRAY400,
                       fontName='Helvetica', alignment=TA_CENTER)))

    doc.build(story)
    print(f'PDF created: {out_path}')


if __name__ == '__main__':
    build_pdf('/home/user/AutoToDo/feedback-prozess.pdf')
