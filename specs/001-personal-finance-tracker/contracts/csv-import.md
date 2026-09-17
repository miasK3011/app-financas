# Contrato: `domain/csvImport`

Ambos os parsers implementam a mesma interface, permitindo que o repositório de importação trate
os dois formatos (FR-010) de forma uniforme.

```ts
interface CsvParseResult {
  imported: CompraDraft[]; // pronto para virar Compra (ainda sem id/cartaoId/loteImportacaoId)
  skipped: { rawLine: string; reason: string }[]; // FR-026 — reportado ao usuário, nunca interrompe
}

interface CompraDraft {
  descricao: string;
  valorTotalOriginal: number; // centavos
  dataCompra: Date;
  parcelasTotal: number; // 1 quando não detectado padrão de parcela
  parcelaAtual: number;  // 1 quando não detectado padrão de parcela
}

function parse(rawCsv: string): CsvParseResult;
```

## `genericParser.parse`

- Espera cabeçalho `data;valor;descricao` (`;` como separador — formato genérico definido pelo
  próprio app).
- `data` em `DD/MM/AAAA`; `valor` decimal com vírgula (`123,45`) convertido para centavos.
- Linha sem `data` ou sem `valor` (vazio ou não parseável) → vai para `skipped` com o motivo
  (`"Data ausente ou inválida"` / `"Valor ausente ou inválido"`) e a importação continua (FR-026).

## `nubankParser.parse`

- Espera cabeçalho exato `date,title,amount` (`,` como separador) — ver decisão e ressalva de
  validação pendente em `research.md`.
- `date` em `YYYY-MM-DD`; `amount` decimal com ponto, convertido para centavos.
- Se `title` contém o padrão `Parcela (\d+)\/(\d+)` (case-insensitive), o `CompraDraft` resultante
  usa `parcelasTotal = M`, `parcelaAtual = N`, e `descricao` = o texto de `title` sem o sufixo
  `- Parcela N/M` — reaproveitando o mesmo fluxo de "parcelamento já em andamento" do FR-004 (ver
  `research.md`, Decisão: Formato do CSV do Nubank).
- Mesmo tratamento de linha inválida/incompleta que o parser genérico (FR-026).

## Uso pelo repositório (fora do domínio, apenas para contexto)

O repositório de importação recebe `CsvParseResult`, associa cada `CompraDraft` ao `cardId`
escolhido pelo usuário na tela `ImportarCSV`, cria um `LoteImportacao`
(`totalLinhas/linhasImportadas/linhasIgnoradas` vindos direto de `imported.length`/`skipped.length`),
e persiste cada `CompraDraft` como uma Compra normal (`origem = CSV_IMPORT`), passando pelo mesmo
`installments.splitInstallments` + `allocateInstallmentsToInvoices` de qualquer outra compra
parcelada — sem caminho especial de persistência para dados importados.
