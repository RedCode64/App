import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { colors, fonts } from '../theme';
import { useStore } from '../store/useStore';

const KIND_COLORS = {
  info: colors.cyan,
  success: colors.green,
  error: colors.red,
} as const;

/** Global toast host; renders whatever message is in the store. */
export function ToastHost() {
  const toast = useStore((s) => s.toast);
  const clearToast = useStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => clearToast(), 3200);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;
  const color = KIND_COLORS[toast.kind];

  return (
    <Animated.View
      key={toast.id}
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(200)}
      style={[styles.container, { borderColor: color, shadowColor: color }]}
      pointerEvents="none"
    >
      <Text style={[styles.text, { color }]}>{toast.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    zIndex: 1000,
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
  },
});
