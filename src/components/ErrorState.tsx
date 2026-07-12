import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import { NeonButton } from './NeonButton';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

/** Network / sync failure state with a retry affordance. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline" size={40} color={colors.red} />
      <Text style={styles.title}>UPLINK SEVERED</Text>
      <Text style={styles.message}>{message}</Text>
      <NeonButton label="RE-ESTABLISH LINK" onPress={onRetry} color={colors.cyan} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 3,
    color: colors.red,
  },
  message: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
});
