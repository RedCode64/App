import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors, fonts } from '../theme';

interface NeonButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  variant?: 'solid' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function NeonButton({
  label,
  onPress,
  color = colors.cyan,
  variant = 'outline',
  disabled = false,
  loading = false,
  style,
}: NeonButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        {
          borderColor: color,
          backgroundColor: variant === 'solid' ? `${color}22` : 'transparent',
          opacity: inactive ? 0.4 : pressed ? 0.7 : 1,
          shadowColor: color,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[styles.label, { color }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  label: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 2,
  },
});
