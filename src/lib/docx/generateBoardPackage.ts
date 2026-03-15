import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  Paragraph,
  TableCell,
  TextRun,
} from 'docx';
import type { RAGStatus, ReportDraft, ReportMetadata } from '@/types/state';
import {
  ACCENT_COLOR,
  ALERT_COLOR,
  buildPageHeaderText,
  DOCUMENT_STYLES,
  DOCUMENT_STYLE_IDS,
  getRagCellFill,
  PAGE_FOOTER_TEXT,
} from '@/lib/docx/croweStyling';

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

function buildBodyParagraphs(content: string): Paragraph[] {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map(
    (block) =>
      new Paragraph({
        style: DOCUMENT_STYLE_IDS.body,
        children: [
          new TextRun({
            text: block.replace(/\n+/g, ' '),
          }),
        ],
      }),
  );
}

function buildRagParagraph(ragStatus?: RAGStatus): Paragraph[] {
  if (!ragStatus) {
    return [];
  }

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

export function createRagTableCell(children: Paragraph[], ragStatus: RAGStatus): TableCell {
  return new TableCell({
    shading: {
      fill: getRagCellFill(ragStatus),
    },
    children,
  });
}

export async function generateBoardPackageDOCX(
  reportDraft: ReportDraft,
  metadata: ReportMetadata,
): Promise<string> {
  const header = buildHeader(metadata);
  const footer = buildFooter();

  const doc = new Document({
    creator: 'Crowe AI Innovation Team',
    title: `${metadata.institutionName} Board Package`,
    description: `${metadata.meetingType} board package for ${metadata.meetingDate}`,
    styles: DOCUMENT_STYLES,
    sections: reportDraft.sections.map((section) => ({
      headers: { default: header },
      footers: { default: footer },
      children: [
        new Paragraph({
          text: section.title,
          style: DOCUMENT_STYLE_IDS.heading1,
          heading: HeadingLevel.HEADING_1,
        }),
        ...buildRagParagraph(section.ragStatus),
        ...buildBodyParagraphs(section.content),
      ],
    })),
  });

  return Buffer.from(await Packer.toBuffer(doc)).toString('base64');
}
