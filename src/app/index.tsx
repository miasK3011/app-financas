import { Redirect } from 'expo-router';

/**
 * Fix #3: numa build standalone (fora do Expo Go), o cold boot do app
 * resolve o caminho raiz "/" antes de qualquer navegação — sem uma
 * rota aqui, cai direto em "Unmatched Route". As abas nunca se
 * chamaram "index" (são "inicio", "cartoes" etc.), então nada
 * respondia por "/" até agora.
 */
export default function RootIndex() {
  return <Redirect href="/inicio" />;
}
