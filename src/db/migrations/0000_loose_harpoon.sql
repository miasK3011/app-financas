CREATE TABLE `assinatura_tags` (
	`assinatura_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`assinatura_id`, `tag_id`),
	FOREIGN KEY (`assinatura_id`) REFERENCES `assinaturas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `assinaturas` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`valor` integer NOT NULL,
	`forma_pagamento` text NOT NULL,
	`cartao_id` text,
	`dia_cobranca` integer NOT NULL,
	`data_inicio` integer NOT NULL,
	`cancelada_em` integer,
	`categoria_id` text,
	FOREIGN KEY (`cartao_id`) REFERENCES `cartoes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cartoes` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`dia_fechamento` integer NOT NULL,
	`dia_vencimento` integer NOT NULL,
	`arquivado_em` integer,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categorias` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`icone` text NOT NULL,
	`predefinida` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `compra_tags` (
	`compra_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`compra_id`, `tag_id`),
	FOREIGN KEY (`compra_id`) REFERENCES `compras`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `compras` (
	`id` text PRIMARY KEY NOT NULL,
	`descricao` text NOT NULL,
	`valor_total_original` integer NOT NULL,
	`data_compra` integer NOT NULL,
	`forma_pagamento` text NOT NULL,
	`cartao_id` text,
	`parcelas_total` integer DEFAULT 1 NOT NULL,
	`parcela_atual` integer DEFAULT 1 NOT NULL,
	`comentario` text,
	`categoria_id` text,
	`estabelecimento_id` text,
	`estabelecimento_manual` integer DEFAULT false NOT NULL,
	`valor_responsabilidade` integer,
	`motivo` text,
	`responsavel` text,
	`origem` text NOT NULL,
	`assinatura_id` text,
	`lote_importacao_id` text,
	`criado_em` integer NOT NULL,
	FOREIGN KEY (`cartao_id`) REFERENCES `cartoes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`estabelecimento_id`) REFERENCES `estabelecimentos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assinatura_id`) REFERENCES `assinaturas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lote_importacao_id`) REFERENCES `lotes_importacao`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `configuracoes_renda` (
	`id` text PRIMARY KEY NOT NULL,
	`valor` integer NOT NULL,
	`vigente_desde` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entradas_avulsas` (
	`id` text PRIMARY KEY NOT NULL,
	`descricao` text NOT NULL,
	`valor` integer NOT NULL,
	`data` integer NOT NULL,
	`compra_vinculada_id` text,
	FOREIGN KEY (`compra_vinculada_id`) REFERENCES `compras`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `estabelecimentos` (
	`id` text PRIMARY KEY NOT NULL,
	`nome_exibicao` text NOT NULL,
	`icone_respaldo` text NOT NULL,
	`dominio` text,
	`logo_cache_path` text,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `faturas` (
	`id` text PRIMARY KEY NOT NULL,
	`cartao_id` text NOT NULL,
	`referencia_ano` integer NOT NULL,
	`referencia_mes` integer NOT NULL,
	`data_fechamento` integer NOT NULL,
	`data_vencimento` integer NOT NULL,
	`status` text NOT NULL,
	`paga_em` integer,
	FOREIGN KEY (`cartao_id`) REFERENCES `cartoes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `faturas_cartao_ano_mes_unique` ON `faturas` (`cartao_id`,`referencia_ano`,`referencia_mes`);--> statement-breakpoint
CREATE TABLE `lancamentos_reserva` (
	`id` text PRIMARY KEY NOT NULL,
	`reserva_id` text NOT NULL,
	`tipo` text NOT NULL,
	`valor` integer NOT NULL,
	`data` integer NOT NULL,
	`observacao` text,
	FOREIGN KEY (`reserva_id`) REFERENCES `reservas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lotes_importacao` (
	`id` text PRIMARY KEY NOT NULL,
	`cartao_id` text NOT NULL,
	`formato` text NOT NULL,
	`importado_em` integer NOT NULL,
	`nome_arquivo` text NOT NULL,
	`total_linhas` integer NOT NULL,
	`linhas_importadas` integer NOT NULL,
	`linhas_ignoradas` integer NOT NULL,
	FOREIGN KEY (`cartao_id`) REFERENCES `cartoes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meta_consumo_ideal` (
	`id` text PRIMARY KEY NOT NULL,
	`percentual_da_renda` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `padroes_reconhecimento` (
	`id` text PRIMARY KEY NOT NULL,
	`estabelecimento_id` text NOT NULL,
	`texto` text NOT NULL,
	FOREIGN KEY (`estabelecimento_id`) REFERENCES `estabelecimentos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `parcelas` (
	`id` text PRIMARY KEY NOT NULL,
	`compra_id` text NOT NULL,
	`fatura_id` text,
	`numero` integer NOT NULL,
	`valor` integer NOT NULL,
	`valor_responsabilidade` integer NOT NULL,
	FOREIGN KEY (`compra_id`) REFERENCES `compras`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fatura_id`) REFERENCES `faturas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reservas` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`taxa_rendimento_mensal_percentual` real,
	`arquivado_em` integer
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_nome_unique` ON `tags` (`nome`);