/*
 * Minimal, dependency-free PDF generator used for demo data (seed) and tests.
 * Produces a valid single-page PDF 1.4 document with a correct cross-reference table.
 */

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 72;

/** Keeps printable ASCII only and escapes PDF string delimiters. */
const toPdfText = (text) =>
  String(text)
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const buildContentStream = (title, lines) => {
  const commands = [
    'BT',
    '/F1 22 Tf',
    `${MARGIN} ${PAGE_HEIGHT - MARGIN} Td`,
    `(${toPdfText(title)}) Tj`,
    '/F1 12 Tf',
    '18 TL',
    'T*',
    'T*',
  ];
  lines.forEach((line) => commands.push(`(${toPdfText(line)}) Tj`, 'T*'));
  commands.push('ET');
  return commands.join('\n');
};

/**
 * @param {{ title: string, lines?: string[] }} options
 * @returns {Buffer} PDF bytes
 */
export const createSimplePdf = ({ title, lines = [] }) => {
  const content = buildContentStream(title, lines);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      '/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = objects.map((object, index) => {
    const offset = Buffer.byteLength(pdf, 'latin1');
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
};
