import * as DocumentPicker from 'expo-document-picker';
import { randomUUID } from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import { readAsStringAsync } from 'expo-file-system/legacy';

import { db } from '@/db/client';
import { lotesImportacao } from '@/db/schema';
import { parse as parseGeneric } from '@/domain/csvImport/genericParser';
import { parse as parseNubank } from '@/domain/csvImport/nubankParser';
import type { CsvParseResult } from '@/domain/csvImport/types';

import { createCardPurchase } from './purchasesRepository';

export type CsvFormat = 'GENERICO' | 'NUBANK';

/**
 * Mesmo contorno do bug conhecido do Expo Go (expo/expo#21792) já
 * documentado em `backupRepository.ts` — copiar o arquivo escolhido
 * para o cache do próprio app antes de ler, usando a mesma família de
 * API (`File`) tanto para copiar quanto para ler.
 */
async function copyPickedFileToOwnCache(uri: string, name: string): Promise<string> {
  const source = new File(uri);
  const destination = new File(Paths.cache, `csv-import-${Date.now()}-${name}`);
  if (destination.exists) destination.delete();
  await source.copy(destination);
  return destination.uri;
}

async function readFileText(uri: string): Promise<string> {
  try {
    return await new File(uri).text();
  } catch (newApiError) {
    try {
      return await readAsStringAsync(uri);
    } catch (legacyApiError) {
      throw new Error(`${(newApiError as Error).message} / ${(legacyApiError as Error).message}`);
    }
  }
}

export type PickedCsvFile = { name: string; text: string };

/** Abre o seletor de arquivo nativo e já devolve o texto lido. `null` se o usuário cancelar. */
export async function pickCsvFile(): Promise<PickedCsvFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: false,
  });
  if (result.canceled || !result.assets?.[0]) {
    return null;
  }
  const asset = result.assets[0];
  const localUri = await copyPickedFileToOwnCache(asset.uri, asset.name);
  const text = await readFileText(localUri);
  return { name: asset.name, text };
}

export type ImportCsvResult = {
  loteId: string;
  totalLinhas: number;
  linhasImportadas: number;
  linhasIgnoradas: number;
  skipped: CsvParseResult['skipped'];
};

/**
 * FR-009/FR-010/FR-026: interpreta o CSV com o parser do formato
 * escolhido, cria o `LoteImportacao` e persiste cada linha válida como
 * uma Compra normal (`origem = 'CSV_IMPORT'`), reaproveitando
 * `createCardPurchase` — mesmo `splitInstallments`/
 * `allocateInstallmentsToInvoices` de qualquer outra compra parcelada,
 * sem caminho especial de persistência (contracts/csv-import.md).
 */
export async function importCsv(
  cardId: string,
  format: CsvFormat,
  fileName: string,
  rawCsv: string,
): Promise<ImportCsvResult> {
  const parseResult = format === 'NUBANK' ? parseNubank(rawCsv) : parseGeneric(rawCsv);
  const totalLinhas = parseResult.imported.length + parseResult.skipped.length;

  const loteId = randomUUID();
  await db.insert(lotesImportacao).values({
    id: loteId,
    cartaoId: cardId,
    formato: format,
    importadoEm: new Date(),
    nomeArquivo: fileName,
    totalLinhas,
    linhasImportadas: parseResult.imported.length,
    linhasIgnoradas: parseResult.skipped.length,
  });

  for (const draft of parseResult.imported) {
    await createCardPurchase({
      descricao: draft.descricao,
      valorTotalOriginal: draft.valorTotalOriginal,
      dataCompra: draft.dataCompra,
      cartaoId: cardId,
      parcelasTotal: draft.parcelasTotal,
      parcelaAtual: draft.parcelaAtual,
      origem: 'CSV_IMPORT',
      loteImportacaoId: loteId,
    });
  }

  return {
    loteId,
    totalLinhas,
    linhasImportadas: parseResult.imported.length,
    linhasIgnoradas: parseResult.skipped.length,
    skipped: parseResult.skipped,
  };
}
