import type { CompraDraft, CsvParseResult } from './types';

const HEADER = 'data;valor;descricao';

function parseBRDate(raw: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getMonth() === Number(month) - 1 ? date : null; // rejeita ex.: 31/02
}

function parseBRLValue(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, '').replace(',', '.');
  if (normalized === '' || Number.isNaN(Number(normalized))) return null;
  return Math.round(Number(normalized) * 100);
}

/**
 * `contracts/csv-import.md` § `genericParser.parse` — formato genérico
 * definido pelo próprio app: `;` como separador, `data` em
 * `DD/MM/AAAA`, `valor` decimal com vírgula.
 */
export function parse(rawCsv: string): CsvParseResult {
  const lines = rawCsv.split(/\r?\n/).filter((line) => line.trim() !== '');
  const hasHeader = lines[0]?.trim().toLowerCase() === HEADER;
  const rows = hasHeader ? lines.slice(1) : lines;

  const imported: CompraDraft[] = [];
  const skipped: CsvParseResult['skipped'] = [];

  for (const rawLine of rows) {
    const [rawData = '', rawValor = '', ...rest] = rawLine.split(';');

    const dataCompra = parseBRDate(rawData);
    if (!dataCompra) {
      skipped.push({ rawLine, reason: 'Data ausente ou inválida' });
      continue;
    }

    const valorTotalOriginal = parseBRLValue(rawValor);
    if (valorTotalOriginal === null) {
      skipped.push({ rawLine, reason: 'Valor ausente ou inválido' });
      continue;
    }

    imported.push({
      descricao: rest.join(';').trim() || 'Compra importada',
      valorTotalOriginal,
      dataCompra,
      parcelasTotal: 1,
      parcelaAtual: 1,
    });
  }

  return { imported, skipped };
}
