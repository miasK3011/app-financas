import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
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
 * T064, parte 1: abre o seletor de arquivo nativo. Retorna `null` se o
 * usuário cancelar — a validação em si (`readAndValidateBackupFile`)
 * fica separada para a tela `BackupConfirmar` poder rodá-la de novo
 * sem reabrir o seletor.
 */
export async function pickBackupFileUri(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) {
    return null;
  }
  return result.assets[0].uri;
}

/**
 * T064, parte 2: lê e valida o conteúdo de um arquivo de backup ANTES
 * de qualquer escrita no banco — nunca tenta "consertar" um arquivo
 * malformado (contracts/backup.md).
 */
export async function readAndValidateBackupFile(uri: string): Promise<ValidateBackupResult> {
  let raw: unknown;
  try {
    const text = await new File(uri).text();
    raw = JSON.parse(text);
  } catch {
    return { valid: false, reason: 'Não foi possível ler o arquivo selecionado como JSON' };
  }
  return validateBackupFile(raw);
}
