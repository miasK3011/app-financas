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
    // O CSV traz "150,00" como o valor DESTA parcela (1/3), não da
    // compra inteira — valorTotalOriginal reconstitui o total
    // (150,00 × 3 = 450,00) para que splitInstallments, ao dividir de
    // volta por 3, recupere o valor certo de cada parcela.
    expect(parcelado).toMatchObject({
      parcelasTotal: 3,
      parcelaAtual: 1,
      valorTotalOriginal: 45000,
    });

    const outroParcelado = result.imported.find(
      (item) => item.descricao === 'MercadoOnline*Loja Xyz',
    );
    expect(outroParcelado).toMatchObject({
      parcelasTotal: 4,
      parcelaAtual: 1,
      valorTotalOriginal: 16000, // "40,00" (valor da parcela) × 4
    });
  });

  it('reconstructs the full total from a per-installment amount (regression: "Mp *Aliexpress - Parcela 1/4","35,69")', () => {
    const csv = 'date,title,amount\n2026-08-27,Mp *Aliexpress - Parcela 1/4,"35,69"\n';
    const result = parse(csv);
    expect(result.imported).toEqual([
      {
        descricao: 'Mp *Aliexpress',
        valorTotalOriginal: 14276, // 35,69 × 4 — nunca 35,69 dividido por 4
        dataCompra: new Date(2026, 7, 27),
        parcelasTotal: 4,
        parcelaAtual: 1,
      },
    ]);
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
