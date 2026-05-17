from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
import re

# Read markdown content
with open("guides/guia-bunny-stream.md", "r") as f:
    content = f.read()

# Create PDF
doc = SimpleDocTemplate(
    "guides/guia-bunny-stream.pdf",
    pagesize=A4,
    rightMargin=2*cm, leftMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm
)

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=colors.HexColor('#1a1a1a'),
    spaceAfter=20,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

heading2_style = ParagraphStyle(
    'CustomH2',
    parent=styles['Heading2'],
    fontSize=13,
    textColor=colors.HexColor('#000000'),
    spaceBefore=16,
    spaceAfter=6,
    fontName='Helvetica-Bold',
    backColor=colors.HexColor('#f5c800'),
    leftIndent=0,
    rightIndent=0,
    borderPadding=4,
)

heading3_style = ParagraphStyle(
    'CustomH3',
    parent=styles['Heading3'],
    fontSize=11,
    textColor=colors.HexColor('#34495e'),
    spaceBefore=10,
    spaceAfter=4,
    fontName='Helvetica-Bold'
)

body_style = ParagraphStyle(
    'CustomBody',
    parent=styles['BodyText'],
    fontSize=10,
    leading=14,
    spaceAfter=6,
    fontName='Helvetica'
)

code_style = ParagraphStyle(
    'CustomCode',
    parent=styles['Code'],
    fontSize=9,
    leading=12,
    textColor=colors.HexColor('#2c3e50'),
    backColor=colors.HexColor('#f4f4f4'),
    leftIndent=10,
    rightIndent=10,
    spaceBefore=4,
    spaceAfter=4,
    borderPadding=6,
    fontName='Courier'
)

story = []

lines = content.split("\n")
i = 0
while i < len(lines):
    line = lines[i]

    if line.startswith("# ") and not line.startswith("## "):
        story.append(Paragraph(line[2:].strip(), title_style))
        story.append(Spacer(1, 0.3*cm))
    elif line.startswith("## "):
        story.append(Spacer(1, 0.2*cm))
        story.append(Paragraph(line[3:].strip(), heading2_style))
    elif line.startswith("### "):
        story.append(Spacer(1, 0.1*cm))
        story.append(Paragraph(line[4:].strip(), heading3_style))
    elif line.startswith("---"):
        story.append(Spacer(1, 0.2*cm))
    elif line.startswith("```"):
        i += 1
        code_lines = []
        while i < len(lines) and not lines[i].startswith("```"):
            code_lines.append(lines[i])
            i += 1
        code_text = "<br/>".join(code_lines)
        story.append(Paragraph(code_text, code_style))
    elif line.strip().startswith("- ") or line.strip().startswith("* "):
        text = line.strip()[2:]
        text = text.replace("**", "<b>", 1).replace("**", "</b>", 1)
        story.append(Paragraph("&#8226; " + text, body_style))
    elif line.strip() and line.strip()[0].isdigit() and ". " in line[:4]:
        text = line.strip()[3:]
        text = text.replace("**", "<b>", 1).replace("**", "</b>", 1)
        story.append(Paragraph(line.strip()[:3] + " " + text, body_style))
    elif line.startswith("|") and not line.startswith("|---"):
        table_rows = []
        while i < len(lines) and lines[i].startswith("|") and not lines[i].startswith("|---"):
            cells = [c.strip() for c in lines[i].split("|")[1:-1]]
            table_rows.append(cells)
            i += 1
        if i < len(lines) and lines[i].startswith("|---"):
            i += 1
        if table_rows:
            table_data = []
            for row in table_rows:
                table_data.append([Paragraph(cell, body_style) for cell in row])
            if table_data:
                table = Table(table_data, colWidths=[8*cm, 8*cm])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9f9f9')),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#ddd')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]))
                story.append(Spacer(1, 0.2*cm))
                story.append(table)
                story.append(Spacer(1, 0.2*cm))
        continue
    elif line.strip():
        text = line.strip()
        text = re.sub(r'`([^`]+)`', r'<font name="Courier" size="9" color="#c0392b">\1</font>', text)
        text = text.replace("**", "<b>", 1).replace("**", "</b>", 1)
        text = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'<font color="#2980b9"><u>\1</u></font>', text)
        story.append(Paragraph(text, body_style))
    else:
        story.append(Spacer(1, 0.1*cm))

    i += 1

doc.build(story)
print("PDF created successfully!")
