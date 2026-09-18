import Papa from 'papaparse';

import type { CompraDraft, CsvParseResult } from './types';

const PAGAMENTO_RECEBIDO = 'Pagamento recebido';
const PARCELA_PATTERN = /\s*-\s*Parcela\s+(\d+)\/(\d+)\s*$/i;

function parseIsoDate(raw: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getMonth() === Number(month) - 1 ? date : null;
}

/**
 * `research.md` § Formato do CSV do Nubank: decimal com VÍRGULA (não
 * ponto), sinal negativo como `-` seguido de espaço antes do número.
 */
function parseNubankAmount(raw: string): number | null {
  const normalized = raw.replace(/\s+/g, '');
  if (normalized === '') return null;
  const isNegative = normalized.startsWith('-');
  const digitsOnly = (isNegative ? normalized.slice(1) : normalized).replace(',', '.');
  if (digitsOnly === '' || Number.isNaN(Number(digitsOnly))) return null;
  const cents = Math.round(Number(digitsOnly) * 100);
  return isNegative ? -cents : cents;
}

type NubankRow = { date?: string; title?: string; amount?: string };

/**
 * `contracts/csv-import.md` § `nubankParser.parse` — cabeçalho exato
 * `date,title,amount`, `,` como separador. `papaparse` cuida de aspas
 * internas escapadas no `title` sem tratamento extra nosso.
 */
export function parse(rawCsv: string): CsvParseResult {
  const { data } = Papa.parse<NubankRow>(rawCsv, { header: true, skipEmptyLines: true });

  const imported: CompraDraft[] = [];
  const skipped: CsvParseResult['skipped'] = [];

  for (const row of data) {
    const rawLine = `${row.date ?? ''},${row.title ?? ''},${row.amount ?? ''}`;
    const title = (row.title ?? '').trim();

    if (title === PAGAMENTO_RECEBIDO) {
      skipped.push({ rawLine, reason: 'Pagamento de fatura anterior — não é uma compra' });
      continue;
    }

    const dataCompra = row.date ? parseIsoDate(row.date) : null;
    if (!dataCompra) {
      skipped.push({ rawLine, reason: 'Data ausente ou inválida' });
      continue;
    }

    const valorLinha = row.amount ? parseNubankAmount(row.amount) : null;
    if (valorLinha === null) {
      skipped.push({ rawLine, reason: 'Valor ausente ou inválido' });
      continue;
    }

    const parcelaMatch = PARCELA_PATTERN.exec(title);
    const descricao = (parcelaMatch ? title.replace(PARCELA_PATTERN, '') : title).trim();
    const parcelasTotal = parcelaMatch ? Number(parcelaMatch[2]) : 1;

    imported.push({
      descricao: descricao || 'Compra importada',
      // O Nubank já reporta `amount` como o valor DESTA parcela, não
      // da compra inteira — reconstituímos o total (valor × parcelas)
      // porque `createCardPurchase`/`splitInstallments` sempre dividem
      // `valorTotalOriginal` pelo total de parcelas de novo. Como a
      // multiplicação é exata (valor × parcelas ÷ parcelas = valor),
      // isso reproduz fielmente o valor original de cada parcela, sem
      // arredondamento espúrio.
      valorTotalOriginal: valorLinha * parcelasTotal,
      dataCompra,
      parcelasTotal,
      parcelaAtual: parcelaMatch ? Number(parcelaMatch[1]) : 1,
    });
  }

  return { imported, skipped };
}
