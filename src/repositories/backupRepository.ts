import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { readAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { db } from '@/db/client';
import {
  assinaturaTags,
  assinaturas,
  cartoes,
  categorias,
  compraTags,
  compras,
  configuracoesRenda,
  entradasAvulsas,
  estabelecimentos,
  faturas,
  lancamentosReserva,
  lotesImportacao,
  metaConsumoIdeal,
  padroesReconhecimento,
  parcelas,
  reservas,
  tags,
} from '@/db/schema';
import type { BackupFile, FullDataSnapshot } from '@/domain/backup/serializeBackup';
import { serializeBackup } from '@/domain/backup/serializeBackup';
import { type ValidateBackupResult, validateBackupFile } from '@/domain/backup/validateBackupFile';

/** Lê as 17 tabelas por completo — sem paginação (volume de uso pessoal). */
export async function exportAll(): Promise<BackupFile> {
  const snapshot: FullDataSnapshot = {
    cartoes: await db.select().from(cartoes),
    faturas: await db.select().from(faturas),
    compras: await db.select().from(compras),
    parcelas: await db.select().from(parcelas),
    tags: await db.select().from(tags),
    compraTags: await db.select().from(compraTags),
    assinaturas: await db.select().from(assinaturas),
    assinaturaTags: await db.select().from(assinaturaTags),
    configuracoesRenda: await db.select().from(configuracoesRenda),
    entradasAvulsas: await db.select().from(entradasAvulsas),
    reservas: await db.select().from(reservas),
    lancamentosReserva: await db.select().from(lancamentosReserva),
    lotesImportacao: await db.select().from(lotesImportacao),
    categorias: await db.select().from(categorias),
    estabelecimentos: await db.select().from(estabelecimentos),
    padroesReconhecimento: await db.select().from(padroesReconhecimento),
    metaConsumoIdeal: (await db.select().from(metaConsumoIdeal))[0] ?? null,
  };

  return serializeBackup(snapshot);
}

/**
 * FR-024: substituição INTEGRAL, nunca mesclagem. Uma única transação
 * — deleta tudo (filhos antes de pais) e insere tudo de volta (pais
 * antes de filhos); se qualquer passo falhar, a transação inteira é
 * revertida e o banco nunca fica parcialmente restaurado.
 */
export async function restoreAll(file: BackupFile): Promise<void> {
  const { data } = file;

  db.transaction((tx) => {
    // Deleta filhos antes de pais.
    tx.delete(entradasAvulsas).run();
    tx.delete(parcelas).run();
    tx.delete(compraTags).run();
    tx.delete(compras).run();
    tx.delete(assinaturaTags).run();
    tx.delete(assinaturas).run();
    tx.delete(lotesImportacao).run();
    tx.delete(faturas).run();
    tx.delete(metaConsumoIdeal).run();
    tx.delete(configuracoesRenda).run();
    tx.delete(lancamentosReserva).run();
    tx.delete(padroesReconhecimento).run();
    tx.delete(reservas).run();
    tx.delete(tags).run();
    tx.delete(estabelecimentos).run();
    tx.delete(cartoes).run();
    tx.delete(categorias).run();

    // Insere pais antes de filhos.
    if (data.categorias.length > 0) tx.insert(categorias).values(data.categorias).run();
    if (data.cartoes.length > 0) tx.insert(cartoes).values(data.cartoes).run();
    if (data.estabelecimentos.length > 0)
      tx.insert(estabelecimentos).values(data.estabelecimentos).run();
    if (data.tags.length > 0) tx.insert(tags).values(data.tags).run();
    if (data.reservas.length > 0) tx.insert(reservas).values(data.reservas).run();
    if (data.configuracoesRenda.length > 0) {
      tx.insert(configuracoesRenda).values(data.configuracoesRenda).run();
    }
    if (data.metaConsumoIdeal) tx.insert(metaConsumoIdeal).values(data.metaConsumoIdeal).run();
    if (data.padroesReconhecimento.length > 0) {
      tx.insert(padroesReconhecimento).values(data.padroesReconhecimento).run();
    }
    if (data.lancamentosReserva.length > 0) {
      tx.insert(lancamentosReserva).values(data.lancamentosReserva).run();
    }
    if (data.faturas.length > 0) tx.insert(faturas).values(data.faturas).run();
    if (data.lotesImportacao.length > 0)
      tx.insert(lotesImportacao).values(data.lotesImportacao).run();
    if (data.assinaturas.length > 0) tx.insert(assinaturas).values(data.assinaturas).run();
    if (data.assinaturaTags.length > 0) tx.insert(assinaturaTags).values(data.assinaturaTags).run();
    if (data.compras.length > 0) tx.insert(compras).values(data.compras).run();
    if (data.compraTags.length > 0) tx.insert(compraTags).values(data.compraTags).run();
    if (data.parcelas.length > 0) tx.insert(parcelas).values(data.parcelas).run();
    if (data.entradasAvulsas.length > 0)
      tx.insert(entradasAvulsas).values(data.entradasAvulsas).run();
  });
}

/**
 * T063: exporta os dados atuais para um `.json` em cache e abre o
 * seletor nativo de compartilhar/salvar (o app não escolhe o destino
 * final — quem decide é o usuário, via `expo-sharing`).
 */
export async function exportBackupToFile(): Promise<void> {
  const backup = await exportAll();
  const file = new File(Paths.cache, `app-financas-backup-${Date.now()}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(backup, null, 2));

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Compartilhamento de arquivos não está disponível neste dispositivo');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Exportar backup',
  });
}

/**
 * Bug conhecido do Expo Go no Android (não específico deste app —
 * expo/expo#21792, aberto desde o SDK 48 e ainda presente no SDK 57):
 * o Expo Go carrega várias versões de cada módulo nativo lado a lado
 * ("versioned modules"), e o `DocumentPicker` e o `FileSystem` acabam
 * lendo a URI `content://` a partir de Contexts Android DIFERENTES —
 * a permissão de leitura concedida pelo seletor (via
 * `ACTION_OPEN_DOCUMENT`) fica presa ao Context que a recebeu, então
 * o `FileSystem` nunca a enxerga, e toda tentativa de ler a URI
 * diretamente falha com "Permission Denial… requires
 * ACTION_OPEN_DOCUMENT" — não importa qual provedor (Downloads,
 * armazenamento externo, etc.) nem qual API (nova ou legada) tenta.
 * Isso não acontece num build nativo standalone, só no Expo Go.
 *
 * O contorno confirmado pela comunidade (mesma issue): pedir pro
 * `expo-file-system` copiar o arquivo pela SUA PRÓPRIA função de cópia
 * (que passa por um caminho do SO diferente da leitura direta e não
 * esbarra nesse mesmo problema de Context) para dentro do cache do
 * nosso próprio app, e só então ler o arquivo já copiado. Usar a
 * mesma família de API (a nova, `File`) tanto para copiar quanto para
 * ler evita mais uma inconsistência: uma primeira tentativa usando a
 * API legada (`copyAsync`) pra copiar produziu um arquivo que nem ela
 * mesma, nem a nova, conseguiam reler depois ("Missing READ
 * permission"/"isn't readable") — sintoma idêntico ao bug original,
 * mas agora dentro do cache do próprio app.
 */
async function copyPickedFileToOwnCache(uri: string, name: string): Promise<string> {
  const source = new File(uri);
  const destination = new File(Paths.cache, `backup-import-${Date.now()}-${name}`);
  if (destination.exists) destination.delete();
  await source.copy(destination);
  return destination.uri;
}

/**
 * T064, parte 1: abre o seletor de arquivo nativo e já copia o arquivo
 * escolhido para o cache do nosso próprio app (ver
 * `copyPickedFileToOwnCache`) — a partir daí, a URI retornada é sempre
 * um `file://` local sem nenhuma restrição de permissão, pronta para
 * `readAndValidateBackupFile` ler quantas vezes precisar. Retorna
 * `null` se o usuário cancelar.
 */
export async function pickBackupFileUri(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: false,
  });
  if (result.canceled || !result.assets?.[0]) {
    return null;
  }
  const asset = result.assets[0];
  return copyPickedFileToOwnCache(asset.uri, asset.name);
}

/** Lê o conteúdo textual de uma URI de arquivo já local (dentro do cache do próprio app). */
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

/**
 * T064, parte 2: lê e valida o conteúdo de um arquivo de backup ANTES
 * de qualquer escrita no banco — nunca tenta "consertar" um arquivo
 * malformado (contracts/backup.md). Erros de leitura e de parsing são
 * reportados com mensagens distintas e com o motivo original do
 * sistema operacional, para dar um diagnóstico acionável em vez de um
 * "arquivo inválido" genérico.
 */
export async function readAndValidateBackupFile(uri: string): Promise<ValidateBackupResult> {
  let text: string;
  try {
    text = await readFileText(uri);
  } catch (error) {
    console.error('[backup] falha ao ler arquivo selecionado', uri, error);
    return {
      valid: false,
      reason: `Não foi possível ler o arquivo selecionado: ${(error as Error).message}`,
    };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    console.error('[backup] falha ao interpretar o JSON do arquivo', error);
    return {
      valid: false,
      reason: `O arquivo selecionado não é um JSON válido: ${(error as Error).message}`,
    };
  }

  return validateBackupFile(raw);
}
