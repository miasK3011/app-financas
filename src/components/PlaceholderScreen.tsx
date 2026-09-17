import { StyleSheet, Text, View } from 'react-native';

/**
 * Temporary stand-in for every route while T007 wires up the navigation
 * skeleton. Each screen replaces this with its real implementation in a
 * later task (see tasks.md).
 */
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Ainda não implementado</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6C6C6D',
  },
});
