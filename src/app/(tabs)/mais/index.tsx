import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const ITEMS: { href: '/mais/renda' | '/mais/categorias' | '/mais/estabelecimentos' | '/mais/backup'; label: string }[] = [
  { href: '/mais/renda', label: 'Renda & Entradas' },
  { href: '/mais/categorias', label: 'Categorias' },
  { href: '/mais/estabelecimentos', label: 'Estabelecimentos' },
  { href: '/mais/backup', label: 'Backup' },
];

export default function MaisScreen() {
  return (
    <View style={styles.container}>
      {ITEMS.map((item) => (
        <Link key={item.href} href={item.href} style={styles.row}>
          <Text style={styles.rowLabel}>{item.label}</Text>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 24 },
  row: { paddingVertical: 16, paddingHorizontal: 20 },
  rowLabel: { fontSize: 16, fontWeight: '600' },
});
