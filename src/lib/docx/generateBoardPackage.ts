import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { RAGStatus, ReportDraft, ReportMetadata } from '@/types/state';
import {
  ACCENT_COLOR,
  ALERT_COLOR,
  BODY_FONT,
  buildPageHeaderText,
  DOCUMENT_STYLES,
  DOCUMENT_STYLE_IDS,
  getRagCellFill,
  HEADING_COLOR,
  NUMBERING_CONFIG,
  PAGE_FOOTER_TEXT,
  TABLE_HEADER_FILL,
} from '@/lib/docx/croweStyling';

// ─── Header / Footer ─────────────────────────────────────────────────────────

function buildHeader(metadata: ReportMetadata): Header {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: buildPageHeaderText(metadata.institutionName, metadata.meetingDate),
            size: 18,
            color: ACCENT_COLOR,
          }),
        ],
      }),
    ],
  });
}

function buildFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: PAGE_FOOTER_TEXT,
            size: 18,
            color: ALERT_COLOR,
          }),
        ],
      }),
    ],
  });
}

// ─── Inline formatting parser ─────────────────────────────────────────────────

function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Match **bold**, *italic*, or plain text segments
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      runs.push(new TextRun({ text: match[2], bold: true }));
    } else if (match[3]) {
      runs.push(new TextRun({ text: match[3], italics: true }));
    } else if (match[4]) {
      runs.push(new TextRun({ text: match[4] }));
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text })];
}

// ─── Markdown table parser ───────────────────────────────────────────────────

function parseTableRow(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function isSeparatorRow(line: string): boolean {
  return /^\|[\s:_-]+(\|[\s:_-]+)*\|$/.test(line.trim());
}

function parseMarkdownTable(lines: string[]): Table | null {
  const dataLines = lines.filter((l) => !isSeparatorRow(l));
  if (dataLines.length < 1) return null;

  const headerCells = parseTableRow(dataLines[0]);
  const columnCount = headerCells.length;
  const bodyRows = dataLines.slice(1).map(parseTableRow);

  const headerRow = new TableRow({
    tableHeader: true,
    children: headerCells.map(
      (cell) =>
        new TableCell({
          shading: { fill: TABLE_HEADER_FILL, type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cell,
                  bold: true,
                  color: 'FFFFFF',
                  font: BODY_FONT,
                  size: 20,
                }),
              ],
            }),
          ],
        }),
    ),
  });

  const rows = bodyRows.map(
    (cells) =>
      new TableRow({
        children: Array.from({ length: columnCount }, (_, i) =>
          new TableCell({
            children: [
              new Paragraph({
                style: DOCUMENT_STYLE_IDS.body,
                children: parseInlineFormatting(cells[i] ?? ''),
              }),
            ],
          }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...rows],
  });
}

// ─── Markdown → DOCX elements ────────────────────────────────────────────────

function markdownToDocxElements(content: string): (Paragraph | Table)[] {
  const lines = content.split('\n');
  const elements: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // ### Heading 3
    if (line.startsWith('### ')) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          style: DOCUMENT_STYLE_IDS.heading3,
          children: parseInlineFormatting(line.slice(4)),
        }),
      );
      i++;
      continue;
    }

    // ## Heading 2
    if (line.startsWith('## ')) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          style: DOCUMENT_STYLE_IDS.heading2,
          children: parseInlineFormatting(line.slice(3)),
        }),
      );
      i++;
      continue;
    }

    // Table block: consecutive lines starting with |
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const table = parseMarkdownTable(tableLines);
      if (table) elements.push(table);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        new Paragraph({
          indent: { left: 720 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 3, color: ACCENT_COLOR },
          },
          children: parseInlineFormatting(line.slice(2)),
        }),
      );
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(line)) {
      elements.push(
        new Paragraph({
          bullet: { level: 0 },
          children: parseInlineFormatting(line.replace(/^[-*] /, '')),
        }),
      );
      i++;
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      elements.push(
        new Paragraph({
          numbering: { reference: 'sentinel-ordered', level: 0 },
          children: parseInlineFormatting(line.replace(/^\d+\. /, '')),
        }),
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      new Paragraph({
        style: DOCUMENT_STYLE_IDS.body,
        children: parseInlineFormatting(line),
      }),
    );
    i++;
  }

  return elements;
}

// ─── RAG status paragraph ────────────────────────────────────────────────────

function buildRagParagraph(ragStatus?: RAGStatus): Paragraph[] {
  if (!ragStatus) return [];
  return [
    new Paragraph({
      style: DOCUMENT_STYLE_IDS.heading2,
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: `Status: ${ragStatus.toUpperCase()}`,
          color: ragStatus === 'red' ? ALERT_COLOR : ACCENT_COLOR,
        }),
      ],
    }),
  ];
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function createRagTableCell(children: Paragraph[], ragStatus: RAGStatus): TableCell {
  return new TableCell({
    shading: { fill: getRagCellFill(ragStatus) },
    children,
  });
}

export async function generateBoardPackageDOCX(
  reportDraft: ReportDraft,
  metadata: ReportMetadata,
): Promise<string> {
  const header = buildHeader(metadata);
  const footer = buildFooter();

  // Cover page — institution name, meeting type, date
  const coverSection = {
    headers: { default: header },
    footers: { default: footer },
    children: [
      new Paragraph({ spacing: { before: 3600 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: metadata.institutionName,
            bold: true,
            font: BODY_FONT,
            size: 44,
            color: HEADING_COLOR,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240 },
        children: [
          new TextRun({
            text: `${metadata.meetingType} Board Package`,
            bold: true,
            font: BODY_FONT,
            size: 32,
            color: ACCENT_COLOR,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [
          new TextRun({
            text: metadata.meetingDate,
            font: BODY_FONT,
            size: 24,
            color: HEADING_COLOR,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600 },
        children: [
          new TextRun({
            text: 'Prepared by Crowe AI Innovation Team',
            font: BODY_FONT,
            size: 20,
            color: ACCENT_COLOR,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80 },
        children: [
          new TextRun({
            text: 'CONFIDENTIAL',
            bold: true,
            font: BODY_FONT,
            size: 18,
            color: ALERT_COLOR,
          }),
        ],
      }),
    ],
  };

  const doc = new Document({
    creator: 'Crowe AI Innovation Team',
    title: `${metadata.institutionName} Board Package`,
    description: `${metadata.meetingType} board package for ${metadata.meetingDate}`,
    styles: DOCUMENT_STYLES,
    numbering: NUMBERING_CONFIG,
    sections: [
      coverSection,
      ...reportDraft.sections.map((section) => ({
        headers: { default: header },
        footers: { default: footer },
        children: [
          new Paragraph({
            text: section.title,
            style: DOCUMENT_STYLE_IDS.heading1,
            heading: HeadingLevel.HEADING_1,
          }),
          ...buildRagParagraph(section.ragStatus),
          ...markdownToDocxElements(section.content),
        ],
      })),
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc)).toString('base64');
}
