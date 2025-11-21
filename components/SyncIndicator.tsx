import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useOfflineStore } from '../store/offlineStore';
import { COLORS } from '../constants/colors';

export default function SyncIndicator() {
  const { isSyncing, lastSyncTime } = useOfflineStore();

  if (!isSyncing && !lastSyncTime) {
    return null;
  }

  if (isSyncing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.text}>Syncing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>✓ Synced</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${COLORS.primary}20`,
    borderRadius: 6,
    gap: 6,
  },
  text: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
});





