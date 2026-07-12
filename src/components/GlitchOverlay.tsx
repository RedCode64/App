import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '../theme';
import { NeonButton } from './NeonButton';
import { GlitchText } from './GlitchText';
import { useStore } from '../store/useStore';

/**
 * Full-screen corruption effect shown when a streak breaks: flickering
 * horizontal tear bars over a dark field.
 */
export function GlitchOverlay() {
  const glitch = useStore((s) => s.glitch);
  const dismiss = useStore((s) => s.dismissGlitch);
  const { width } = useWindowDimensions();
  const flicker = useSharedValue(0);

  useEffect(() => {
    if (!glitch) return;
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 70, easing: Easing.linear }),
        withTiming(0.2, { duration: 90, easing: Easing.linear }),
        withTiming(0.8, { duration: 60, easing: Easing.linear }),
        withTiming(0.4, { duration: 120, easing: Easing.linear }),
      ),
      -1,
      true,
    );
  }, [glitch, flicker]);

  const barsStyle = useAnimatedStyle(() => ({ opacity: flicker.value }));

  if (!glitch) return null;

  const bars = [40, 130, 210, 330, 420, 540, 610];

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, barsStyle]}>
          {bars.map((top, i) => (
            <View
              key={top}
              style={[
                styles.bar,
                {
                  top,
                  width: width * (0.4 + (i % 3) * 0.3),
                  backgroundColor: i % 2 === 0 ? colors.magenta : colors.cyan,
                  alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end',
                },
              ]}
            />
          ))}
        </Animated.View>
        <View style={styles.content}>
          <GlitchText text="SIGNAL LOST" size={32} color={colors.red} intense />
          <Text style={styles.message}>{glitch.message}</Text>
          <Text style={styles.hint}>
            Your streak chain has been severed. Rebuild it one contract at a time — or stockpile streak shields from
            the implant tree.
          </Text>
          <NeonButton label="ACKNOWLEDGE" onPress={dismiss} color={colors.red} variant="solid" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#03040aee',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    height: 5,
    opacity: 0.8,
  },
  content: {
    padding: 32,
    gap: 16,
    alignItems: 'center',
  },
  message: {
    fontFamily: fonts.mono,
    fontSize: 14,
    letterSpacing: 2,
    color: colors.magenta,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
});
