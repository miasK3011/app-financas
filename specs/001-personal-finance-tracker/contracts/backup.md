# Contrato: `domain/backup`

## `serializeBackup(allData: FullDataSnapshot): BackupFile`

```ts
interface BackupFile {
  schemaVersion: number; // versão do schema Drizzle no momento da exportação
  exportedAt: string;    // ISO 8601
  data: {
    cartoes: Cartão[]; faturas: Fatura[]; compras: Compra[]; parcelas: Parcela[];
    tags: Tag[]; compraTags: CompraTag[]; assinaturas: Assinatura[]; assinaturaTags: AssinaturaTag[];
    configuracoesRenda: ConfiguracaoRenda[]; entradasAvulsas: EntradaAvulsa[];
    reservas: Reserva[]; lancamentosReserva: LancamentoReserva[];
    lotesImportacao: LoteImportacao[];
    categorias: Categoria[]; estabelecimentos: Estabelecimento[];
    padroesReconhecimento: PadraoReconhecimento[]; metaConsumoIdeal: MetaConsumoIdeal | null;
  };
}
```

`FullDataSnapshot` é montado pelo repositório lendo todas as tabelas por completo (sem paginação —
volume de dados de uso pessoal, ver Technical Context). `logoCachePath` de Estabelecimento é
incluído como caminho (a imagem em si não é embutida no JSON — ver Assumption de simplicidade;
uma restauração perde o cache de logo e ele é rebuscado no próximo uso online, sem quebrar nada
offline porque o `iconeRespaldo` sempre existe).

## `validateBackupFile(raw: unknown): { valid: true; file: BackupFile } | { valid: false; reason: string }`

Validado com um schema `zod` antes de qualquer escrita no banco: confere `schemaVersion` é um
número conhecido/suportado, e que cada array em `data` tem o formato mínimo esperado. Nunca tenta
"consertar" um arquivo malformado — falha com um motivo claro para a tela `BackupConfirmar`.

## `restoreBackup(file: BackupFile): void` (contrato de uso pelo repositório, não é puro)

Executado pelo repositório dentro de uma única `db.transaction`:

1. Deleta todas as linhas de todas as tabelas de domínio (nunca tabelas de configuração do próprio
   Drizzle/migrations).
2. Insere todas as linhas de `file.data`, na ordem que respeita as foreign keys (Cartão →
   Fatura/Compra/Assinatura → Parcela/CompraTag/AssinaturaTag → ... ).
3. Se qualquer passo falhar, a transação inteira é revertida — o banco nunca fica em estado
   parcialmente restaurado (FR-024, "substituição integral", nunca mesclagem).

A UI (`BackupConfirmar.dc.html`) exige confirmação explícita do usuário antes de chamar este
contrato, pois é uma operação destrutiva e irreversível sobre os dados atuais do dispositivo.
