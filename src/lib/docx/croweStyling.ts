export const HEADING_COLOR = '011E41';
export const ACCENT_COLOR = 'F5A800';
export const ALERT_COLOR = 'E5376B';
export const BODY_FONT = 'Arial';

export const RAG_CELL_FILLS = {
  green: 'D8F3EE',
  amber: 'FDE9B7',
  red: 'F9D7E1',
} as const;

export const TABLE_HEADER_FILL = '011E41';

export const DOCUMENT_STYLE_IDS = {
  heading1: 'CroweHeading1',
  heading2: 'CroweHeading2',
  heading3: 'CroweHeading3',
  body: 'CroweBody',
} as const;

export const PAGE_FOOTER_TEXT = 'Prepared by Crowe AI Innovation Team  CONFIDENTIAL';

export function buildPageHeaderText(institutionName: string, date: string): string {
  return `${institutionName}  Board Package | ${date}`;
}

export function getRagCellFill(status: keyof typeof RAG_CELL_FILLS): string {
  return RAG_CELL_FILLS[status];
}

export const DOCUMENT_STYLES = {
  default: {
    heading1: {
      run: {
        color: HEADING_COLOR,
        font: BODY_FONT,
        bold: true,
        size: 30,
      },
      paragraph: {
        spacing: {
          before: 240,
          after: 120,
        },
      },
    },
    heading2: {
      run: {
        color: ACCENT_COLOR,
        font: BODY_FONT,
        bold: true,
        size: 24,
      },
      paragraph: {
        spacing: {
          before: 120,
          after: 80,
        },
      },
    },
    document: {
      run: {
        font: BODY_FONT,
        size: 22,
      },
      paragraph: {
        spacing: {
          after: 120,
          line: 276,
        },
      },
    },
  },
  paragraphStyles: [
    {
      id: DOCUMENT_STYLE_IDS.heading1,
      name: 'Crowe Heading 1',
      basedOn: 'Heading1',
      next: DOCUMENT_STYLE_IDS.body,
      quickFormat: true,
      run: {
        color: HEADING_COLOR,
        font: BODY_FONT,
        bold: true,
        size: 30,
      },
      paragraph: {
        spacing: {
          before: 240,
          after: 120,
        },
      },
    },
    {
      id: DOCUMENT_STYLE_IDS.heading2,
      name: 'Crowe Heading 2',
      basedOn: 'Heading2',
      next: DOCUMENT_STYLE_IDS.body,
      quickFormat: true,
      run: {
        color: ACCENT_COLOR,
        font: BODY_FONT,
        bold: true,
        size: 24,
      },
      paragraph: {
        spacing: {
          before: 120,
          after: 80,
        },
      },
    },
    {
      id: DOCUMENT_STYLE_IDS.heading3,
      name: 'Crowe Heading 3',
      basedOn: 'Heading3',
      next: DOCUMENT_STYLE_IDS.body,
      quickFormat: true,
      run: {
        color: HEADING_COLOR,
        font: BODY_FONT,
        bold: true,
        size: 22,
      },
      paragraph: {
        spacing: {
          before: 80,
          after: 60,
        },
      },
    },
    {
      id: DOCUMENT_STYLE_IDS.body,
      name: 'Crowe Body',
      basedOn: 'Normal',
      quickFormat: true,
      run: {
        font: BODY_FONT,
        size: 22,
      },
      paragraph: {
        spacing: {
          after: 120,
          line: 276,
        },
      },
    },
  ],
};

export const NUMBERING_CONFIG = {
  config: [
    {
      reference: 'sentinel-ordered',
      levels: [
        {
          level: 0,
          format: 'decimal' as const,
          text: '%1.',
          alignment: 'start' as const,
          style: {
            paragraph: {
              indent: { left: 720, hanging: 360 },
            },
          },
        },
      ],
    },
  ],
};
