/**
 * Client ID gratuito do Brandfetch (cadastro em
 * https://developers.brandfetch.com/register) — desde 2026 é exigido em
 * toda chamada à CDN pública de logotipos
 * (`cdn.brandfetch.io/{dominio}?c=<client_id>`); sem ele a API
 * redireciona para uma página de erro em vez de retornar a imagem, e
 * `fetchAndCacheLogo` (`establishmentsRepository.ts`) nem tenta a busca.
 *
 * Preencha com o client ID depois de se cadastrar (é gratuito, sem
 * necessidade de cartão). Continua sendo um identificador público, não
 * um segredo de backend — não muda a decisão de `research.md` de não
 * precisar de servidor próprio para essa feature.
 */
export const BRANDFETCH_CLIENT_ID: string | null = '1idXHH6hC6CQZzRtOVR';
