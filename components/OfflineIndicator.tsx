import { View, Text, StyleSheet } from 'react-native';
import { useOfflineStore } from '../store/offlineStore';
import { COLORS } from '../constants/colors';

export default function OfflineIndicator() {
  const { isOnline } = useOfflineStore();

  if (isOnline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>You're offline - Changes will sync when online</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.offlineIndicator,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});





