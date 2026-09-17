import {
  CURRENT_SCHEMA_VERSION,
  serializeBackup,
  type FullDataSnapshot,
} from '@/domain/backup/serializeBackup';
import { validateBackupFile } from '@/domain/backup/validateBackupFile';

const emptySnapshot: FullDataSnapshot = {
  cartoes: [],
  faturas: [],
  compras: [],
  parcelas: [],
  tags: [],
  compraTags: [],
  assinaturas: [],
  assinaturaTags: [],
  configuracoesRenda: [],
  entradasAvulsas: [],
  reservas: [],
  lancamentosReserva: [],
  lotesImportacao: [],
  categorias: [],
  estabelecimentos: [],
  padroesReconhecimento: [],
  metaConsumoIdeal: null,
};

describe('validateBackupFile', () => {
  it('accepts a well-formed backup produced by serializeBackup', () => {
    const file = serializeBackup(emptySnapshot);
    const result = validateBackupFile(JSON.parse(JSON.stringify(file)));
    expect(result.valid).toBe(true);
  });

  it('accepts a backup with populated arrays, coercing ISO date strings back to Date', () => {
    const snapshot: FullDataSnapshot = {
      ...emptySnapshot,
      cartoes: [
        {
          id: 'card-1',
          nome: 'Nubank',
          diaFechamento: 10,
          diaVencimento: 17,
          arquivadoEm: null,
          criadoEm: new Date('2026-01-01'),
        },
      ],
    };
    const file = serializeBackup(snapshot);
    const result = validateBackupFile(JSON.parse(JSON.stringify(file)));
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.file.data.cartoes[0].criadoEm).toBeInstanceOf(Date);
    }
  });

  it('rejects an unknown schemaVersion', () => {
    const file = serializeBackup(emptySnapshot);
    const result = validateBackupFile({ ...file, schemaVersion: 999 });
    expect(result.valid).toBe(false);
  });

  it('rejects a file missing the schemaVersion field entirely', () => {
    const result = validateBackupFile({
      exportedAt: new Date().toISOString(),
      data: emptySnapshot,
    });
    expect(result.valid).toBe(false);
  });

  it('rejects a malformed array shape (missing required field in an item)', () => {
    const file = serializeBackup(emptySnapshot);
    const malformed = {
      ...file,
      data: { ...file.data, cartoes: [{ id: 'card-1', nome: 'Nubank' }] },
    };
    const result = validateBackupFile(malformed);
    expect(result.valid).toBe(false);
  });

  it('rejects a non-object payload', () => {
    expect(validateBackupFile('not json').valid).toBe(false);
    expect(validateBackupFile(null).valid).toBe(false);
  });

  it('serializeBackup stamps the current supported schema version', () => {
    const file = serializeBackup(emptySnapshot);
    expect(file.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});
