import { readFileSync } from 'node:fs';
import path from 'node:path';

import { parse } from '@/domain/csvImport/genericParser';

const fixture = readFileSync(
  path.join(__dirname, '..', '..', '..', 'fixtures', 'generic-sample.csv'),
  'utf-8',
);

describe('genericParser.parse', () => {
  it('imports valid rows and converts BRL comma-decimal values to cents', () => {
    const result = parse(fixture);
    expect(result.imported).toEqual([
      {
        descricao: 'Supermercado ABC',
        valorTotalOriginal: 12345,
        dataCompra: new Date(2026, 8, 5),
        parcelasTotal: 1,
        parcelaAtual: 1,
      },
      {
        descricao: 'Farmácia XYZ',
        valorTotalOriginal: 8990,
        dataCompra: new Date(2026, 8, 10),
        parcelasTotal: 1,
        parcelaAtual: 1,
      },
    ]);
  });

  it('skips a row with missing/invalid date, without interrupting the import (FR-026)', () => {
    const result = parse(fixture);
    expect(result.skipped).toContainEqual(
      expect.objectContaining({ reason: 'Data ausente ou inválida' }),
    );
  });

  it('skips a row with missing/invalid value, without interrupting the import (FR-026)', () => {
    const result = parse(fixture);
    expect(result.skipped).toContainEqual(
      expect.objectContaining({ reason: 'Valor ausente ou inválido' }),
    );
  });

  it('reports exactly 2 imported and 2 skipped rows for the fixture', () => {
    const result = parse(fixture);
    expect(result.imported).toHaveLength(2);
    expect(result.skipped).toHaveLength(2);
  });
});
