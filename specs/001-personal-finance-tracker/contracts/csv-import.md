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

Formato confirmado com um arquivo real (ver `research.md`, Decisão: Formato do CSV do Nubank).

- Espera cabeçalho exato `date,title,amount` (`,` como separador).
- `date` em `YYYY-MM-DD`.
- `amount` é **decimal com vírgula** (formato BRL, ex.: `"152,39"`), podendo vir negativo com um
  `-` seguido de espaço antes do número (ex.: `"- 15,92"`). Parsing: remover espaços internos,
  extrair o sinal, trocar `,` por `.`, então converter para centavos. **Nunca assumir ponto como
  separador decimal neste parser.**
- `title` pode conter aspas internas escapadas no padrão CSV (`""..""`) — o `papaparse` já
  decodifica isso automaticamente, o parser não precisa de tratamento extra.
- **Linha com `title === "Pagamento recebido"` é sempre excluída** (vai para `skipped` com motivo
  informativo `"Pagamento de fatura anterior — não é uma compra"`) — nunca vira uma `Compra`, pois
  representa o pagamento da fatura anterior, não um gasto.
- Toda outra linha com `amount` negativo (estornos/créditos, ex.: `Crédito de "MP *ALIEXPRESS"`)
  **é importada normalmente** como um `CompraDraft` com `valorTotalOriginal` negativo — reduz o
  total da fatura corretamente ao somar (FR-011), sem tratamento especial. Pares de estorno/nova
  cobrança do mesmo estabelecimento (duas linhas do mesmo dia, uma negativa e uma positiva) são
  importados como duas `Compra`s independentes, fielmente ao que consta no extrato — nunca
  deduplicados ou compensados entre si.
- Se `title` contém o padrão `Parcela (\d+)\/(\d+)` (case-insensitive), o `CompraDraft` resultante
  usa `parcelasTotal = M`, `parcelaAtual = N`, e `descricao` = o texto de `title` sem o sufixo
  `- Parcela N/M` — reaproveitando o mesmo fluxo de "parcelamento já em andamento" do FR-004.
- Mesmo tratamento de linha inválida/incompleta (sem `date` ou `amount` não parseável) que o
  parser genérico (FR-026) — isso é diferente e mais raro do que o caso de `Pagamento recebido`
  acima, que é uma linha válida e completa, apenas não-importável por natureza.

## Uso pelo repositório (fora do domínio, apenas para contexto)

O repositório de importação recebe `CsvParseResult`, associa cada `CompraDraft` ao `cardId`
escolhido pelo usuário na tela `ImportarCSV`, cria um `LoteImportacao`
(`totalLinhas/linhasImportadas/linhasIgnoradas` vindos direto de `imported.length`/`skipped.length`),
e persiste cada `CompraDraft` como uma Compra normal (`origem = CSV_IMPORT`), passando pelo mesmo
`installments.splitInstallments` + `allocateInstallmentsToInvoices` de qualquer outra compra
parcelada — sem caminho especial de persistência para dados importados.
