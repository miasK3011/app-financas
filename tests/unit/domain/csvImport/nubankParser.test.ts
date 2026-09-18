import { readFileSync } from 'node:fs';
import path from 'node:path';

import { parse } from '@/domain/csvImport/nubankParser';

const fixture = readFileSync(
  path.join(__dirname, '..', '..', '..', 'fixtures', 'nubank-sample.csv'),
  'utf-8',
);

describe('nubankParser.parse', () => {
  it('parses a negative amount with the "- 12,50" (dash + space) BRL format', () => {
    const result = parse(fixture);
    const credito = result.imported.find((item) => item.descricao.startsWith('Crédito de'));
    expect(credito?.valorTotalOriginal).toBe(-1250);
  });

  it('decodes escaped internal quotes in the title via papaparse', () => {
    const result = parse(fixture);
    const credito = result.imported.find((item) => item.descricao.startsWith('Crédito de'));
    expect(credito?.descricao).toBe('Crédito de "MP *LOJA ONLINE"');
  });

  it('detects the "- Parcela N/M" pattern and strips it from the description', () => {
    const result = parse(fixture);
    const parcelado = result.imported.find((item) => item.descricao === 'Autopecas Silva');
    expect(parcelado).toMatchObject({
      parcelasTotal: 3,
      parcelaAtual: 1,
      valorTotalOriginal: 15000,
    });

    const outroParcelado = result.imported.find(
      (item) => item.descricao === 'MercadoOnline*Loja Xyz',
    );
    expect(outroParcelado).toMatchObject({ parcelasTotal: 4, parcelaAtual: 1 });
  });

  it('excludes "Pagamento recebido" from imported, reporting it as skipped instead', () => {
    const result = parse(fixture);
    expect(result.imported.some((item) => item.descricao === 'Pagamento recebido')).toBe(false);
    expect(result.skipped).toContainEqual(
      expect.objectContaining({ reason: 'Pagamento de fatura anterior — não é uma compra' }),
    );
  });

  it('imports every other row (20 of 21), only "Pagamento recebido" is skipped', () => {
    const result = parse(fixture);
    expect(result.imported).toHaveLength(20);
    expect(result.skipped).toHaveLength(1);
  });
});
