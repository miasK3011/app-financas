# Quickstart: Validação do Controle Financeiro Pessoal — Núcleo

Guia para rodar o app localmente e validar manualmente os cenários de aceite das User Stories P1
(1, 2, 4, 8) e conferir os demais end-to-end. Não substitui os testes unitários de
`app/domain/**` (ver `research.md` — Estratégia de testes); é a validação "roda de verdade no
dispositivo" pedida pelo processo do projeto.

## Pré-requisitos

- Node.js 20 LTS, `npm`/`pnpm`, Expo CLI (`npx expo`).
- Um dispositivo Android físico com o app **Expo Go** instalado, na mesma rede Wi-Fi do computador
  (ou um emulador Android configurado, como alternativa).
- Nenhuma conta ou login é necessária em nenhum momento (Princípio I).

## Setup

```bash
npm install
npx drizzle-kit generate   # gera app/db/migrations/ a partir de app/db/schema.ts
npx expo start
```

Escanear o QR code com o Expo Go. No primeiro boot, o app deve exibir uma tela de loading breve
enquanto as migrations rodam (ver `research.md` — Decisão: Migrations no boot), e então abrir na
tela Início & Estatísticas (`(tabs)/index.tsx`), vazia.

## Cenário 1 — Cartão e cálculo de fatura correto (User Story 1, P1)

1. Cartões → "+" → cadastrar um cartão com fechamento dia 10, vencimento dia 17.
2. Registrar uma compra à vista de R$ 50 na data 5 do mês corrente.
   **Esperado**: aparece na fatura que fecha dia 10 deste mês.
3. Registrar uma compra à vista de R$ 30 exatamente no dia 10.
   **Esperado**: também entra na fatura que fecha no dia 10 (não na seguinte).
4. Registrar uma compra à vista de R$ 20 no dia 11.
   **Esperado**: só aparece na fatura do ciclo seguinte (fecha no próximo mês, dia 10).
5. Abrir a fatura do dia 10 → total deve ser exatamente R$ 80 (SC-003).

## Cenário 2 — Saldo do mês (User Story 2, P1)

1. Renda & Entradas → configurar renda mensal de R$ 3.000.
2. Adicionar uma entrada avulsa de R$ 200 ("freela").
3. Registrar uma compra via Pix de R$ 80.
   **Esperado**: saldo do mês = 3.000 + 200 − 80 = R$ 3.120, atualizado imediatamente em cada
   passo.

## Cenário 3 — Parcelamento, inclusive em andamento (User Story 4, P1)

1. Nova Compra → R$ 300 em 3x no cartão do Cenário 1, comprado hoje.
   **Esperado**: 3 parcelas de R$ 100 — uma na fatura corrente, uma em cada uma das duas
   seguintes; adicionar uma tag à compra e confirmar que aparece nas 3 parcelas.
2. Nova Compra → R$ 1.200 em 12x, informando parcela atual = 5.
   **Esperado**: só são geradas as parcelas 5 a 12 (8 parcelas de R$ 100), começando na fatura do
   mês da data informada; nenhum registro para as parcelas 1–4.
3. Tentar cadastrar uma compra em 6x com parcela atual = 8.
   **Esperado**: erro de validação, cadastro bloqueado (FR-005).

## Cenário 4 — Backup e restauração (User Story 8, P1)

1. Com os dados dos cenários 1–3 já cadastrados: Backup → Exportar → salvar o arquivo `.json`
   gerado (compartilhar/salvar no dispositivo).
2. Backup → Importar → selecionar o arquivo exportado → confirmar restauração na tela
   `BackupConfirmar`.
   **Esperado**: todos os cartões, faturas, compras e parcelas voltam idênticos ao estado exportado
   (SC-007) — conferir especialmente que os totais de fatura do Cenário 1 continuam batendo.

## Cenário 5 — Divisão de responsabilidade em compra compartilhada (User Story 12, P2)

1. Registrar uma compra de R$ 70 (pizza) no cartão.
2. Editar a compra → definir responsabilidade manual = R$ 30, motivo "Dividido com Maria".
   **Esperado**: a fatura continua somando R$ 70 no total, mas exibe "Você paga: R$ 30" (FR-053).
3. Estatísticas do período → conferir que essa compra conta R$ 30 no gasto por categoria/maiores
   gastos, não R$ 70 (FR-054).
4. Registrar uma Entrada Avulsa de R$ 40 vinculada a essa mesma compra (reembolso).
   **Esperado**: a responsabilidade é recalculada automaticamente para R$ 30 (70 − 40) — mesmo
   valor final neste exemplo, mas agora derivado da entrada, não do campo manual (FR-051); a
   entrada de R$ 40 também aparece somada normalmente no saldo do mês.

## Cenário 6 — Importação CSV (User Story 3, P2)

1. Usar os fixtures em `tests/fixtures/` (`generic-sample.csv`, `nubank-sample.csv` — a criar em
   `tasks.md` junto com o parser).
2. Importar CSV → escolher o cartão de destino → selecionar o arquivo genérico.
   **Esperado**: todas as linhas válidas viram compras nas faturas corretas; linhas propositalmente
   inválidas no fixture aparecem na tela `ImportarCSVResultado` como ignoradas, com motivo.
3. Repetir com o arquivo Nubank.
   **Esperado**: mesmo resultado, incluindo o reconhecimento de parcelas via o padrão "Parcela N/M"
   no título (ver ressalva de validação com CSV real em `research.md`).

## Cenário 7 — Melhor cartão, assinaturas e estatísticas (User Stories 5, 6, 11 — P2)

1. Cadastrar um segundo cartão com ciclo de fechamento/vencimento diferente do primeiro.
2. Consultar "melhor cartão para comprar hoje" → confirmar que aponta o cartão cuja fatura vence
   mais tarde a partir de hoje.
3. Cadastrar uma assinatura (ex.: Netflix, R$ 39,90, dia 15, Pix) → abrir a tela de Assinaturas →
   conferir que aparece na lista com o total mensal correto.
4. Abrir Estatísticas → alternar entre Diário/Semanal/Mensal/Anual → conferir que total gasto,
   comparação com período anterior, gasto por categoria, maiores gastos e % de assinaturas mudam
   de forma consistente entre os períodos.

## Critério de "pronto" para este quickstart

Todos os 7 cenários acima devem passar manualmente em um dispositivo Android real antes de
considerar a feature `001-personal-finance-tracker` pronta para revisão — em conjunto com a
suíte Jest de `app/domain/**` (rodada via `npm test`) cobrindo os mesmos cálculos de forma
automatizada e determinística.
