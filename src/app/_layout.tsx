import {
  Lora_500Medium,
  Lora_500Medium_Italic,
  Lora_600SemiBold,
  Lora_700Bold,
} from '@expo-google-fonts/lora';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';

import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { seedPredefinedCategories } from '@/db/seed';
import { generatePendingCharges } from '@/repositories/subscriptionsRepository';
import tamaguiConfig from '@/theme/tamagui.config';

/**
 * Root layout: gates the whole navigation tree behind (1) the Drizzle
 * migration run, (2) the predefined-categories seed and (3) the
 * Manrope/Lora fonts, per research.md's "Migrations do Drizzle no boot
 * do Expo" decision and design-brief.md §3.1. No failure state is ever
 * silent — a broken migration, a failed seed or a missing font all
 * fail loudly here instead of corrupting data or falling back to a
 * system font mid-app.
 */
export default function RootLayout() {
  const { success: migrationsReady, error: migrationError } = useMigrations(db, migrations);
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Lora_500Medium,
    Lora_500Medium_Italic,
    Lora_600SemiBold,
    Lora_700Bold,
  });
  const [seedReady, setSeedReady] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);

  useEffect(() => {
    if (!migrationsReady) return;
    seedPredefinedCategories()
      .then(() => setSeedReady(true))
      .catch(setSeedError);
  }, [migrationsReady]);

  // FR-017: geração idempotente das cobranças de assinatura pendentes
  // do mês — roda em segundo plano a cada abertura do app; uma falha
  // aqui não deve travar o boot (só tenta de novo na próxima abertura).
  useEffect(() => {
    if (!seedReady) return;
    generatePendingCharges().catch((error) => {
      console.error('[assinaturas] falha ao gerar cobranças pendentes', error);
    });
  }, [seedReady]);

  const error = migrationError ?? seedError ?? fontError;
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Não foi possível iniciar o app</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
      </View>
    );
  }

  if (!migrationsReady || !seedReady || !fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        {/* Android moderno (RN 0.86) desenha edge-to-edge por padrão — a
            barra de status vira transparente sobre o conteúdo. "dark"
            deixa os ícones dela escuros, legíveis sobre o fundo claro do
            app (--color-bg); cada tela cobre a faixa da própria barra de
            status com fundo sólido via `components/Screen.tsx`. */}
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 13,
    color: '#6C6C6D',
    textAlign: 'center',
  },
});
