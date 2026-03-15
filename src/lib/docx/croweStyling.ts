export const HEADING_COLOR = '011E41';
export const ACCENT_COLOR = 'F5A800';
export const ALERT_COLOR = 'E5376B';
export const BODY_FONT = 'Arial';

export const RAG_CELL_FILLS = {
  green: 'D8F3EE',
  amber: 'FDE9B7',
  red: 'F9D7E1',
} as const;

export const DOCUMENT_STYLE_IDS = {
  heading1: 'CroweHeading1',
  heading2: 'CroweHeading2',
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
} as const;
