import { type BackupFile, backupFileSchema, SUPPORTED_SCHEMA_VERSIONS } from './serializeBackup';

export type ValidateBackupResult =
  { valid: true; file: BackupFile } | { valid: false; reason: string };

/**
 * Validado ANTES de qualquer escrita no banco (chamado por
 * `backupRepository.restoreAll` — T062/T064). Nunca tenta "consertar"
 * um arquivo malformado — falha com um motivo claro para a tela
 * `BackupConfirmar`. A validação de `schemaVersion` roda antes do
 * parse completo do `zod` para dar uma mensagem específica quando o
 * problema é só a versão (mais comum que corrupção real).
 */
export function validateBackupFile(raw: unknown): ValidateBackupResult {
  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, reason: 'Arquivo de backup inválido: não é um objeto JSON' };
  }

  const schemaVersion = (raw as { schemaVersion?: unknown }).schemaVersion;
  if (typeof schemaVersion !== 'number' || !SUPPORTED_SCHEMA_VERSIONS.includes(schemaVersion)) {
    return {
      valid: false,
      reason: `Versão de backup não suportada: ${JSON.stringify(schemaVersion)}`,
    };
  }

  const result = backupFileSchema.safeParse(raw);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue?.path.join('.') || 'arquivo';
    return {
      valid: false,
      reason: `Arquivo de backup malformado em "${path}": ${firstIssue?.message ?? 'erro desconhecido'}`,
    };
  }

  return { valid: true, file: result.data };
}
