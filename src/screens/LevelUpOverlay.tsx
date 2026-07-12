import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { GlitchText } from '../components/GlitchText';
import { NeonButton } from '../components/NeonButton';
import { useStore } from '../store/useStore';
import { levelUpFx } from '../services/fx';

/** Full-screen cyberpunk level-up celebration. */
export function LevelUpOverlay() {
  const levelUp = useStore((s) => s.levelUp);
  const dismiss = useStore((s) => s.dismissLevelUp);
  const profile = useStore((s) => s.profile);

  const scale = useSharedValue(0.3);
  const ringScale = useSharedValue(0.5);
  const flicker = useSharedValue(1);

  useEffect(() => {
    if (!levelUp) return;
    void levelUpFx(profile?.settings.soundEnabled ?? true);
    scale.value = 0.3;
    ringScale.value = 0.5;
    scale.value = withSpring(1, { damping: 9 });
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(0.95, { duration: 900, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      true,
    );
    flicker.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 80 }),
        withTiming(1, { duration: 60 }),
        withDelay(600, withTiming(1, { duration: 1 })),
      ),
      -1,
      false,
    );
    // Reanimated shared values are stable refs; re-run only on a new level-up.
  }, [levelUp]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!levelUp) return null;

  const numberStyle = { transform: [{ scale }] };
  const ringStyle = { transform: [{ scale: ringScale }], opacity: flicker };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
          <GlitchText text="LEVEL UP" size={36} color={colors.yellow} intense />
          <View style={styles.ringWrap}>
            <AnimatedRing style={ringStyle} />
            <Animated.Text style={[styles.levelNumber, numberStyle]}>{levelUp.level}</Animated.Text>
          </View>
          <Text style={styles.subtitle}>FIRMWARE UPGRADED — CITYWIDE CLEARANCE RAISED</Text>
          <Text style={styles.skillPoint}>+1 SKILL POINT — SPEND IT IN THE IMPLANT TREE</Text>
          <NeonButton label="CONTINUE THE RUN" onPress={dismiss} color={colors.yellow} variant="solid" />
        </Animated.View>
      </View>
    </Modal>
  );
}

function AnimatedRing({ style }: { style: object }) {
  return (
    <Animated.View style={[styles.ring, style]}>
      <Svg width={190} height={190}>
        <Circle cx={95} cy={95} r={88} stroke={colors.cyan} strokeWidth={2} fill="none" strokeDasharray="12 6" />
        <Circle cx={95} cy={95} r={74} stroke={colors.magenta} strokeWidth={1.5} fill="none" strokeDasharray="4 8" />
        <Circle cx={95} cy={95} r={60} stroke={colors.yellow} strokeWidth={2.5} fill="none" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#03040af5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 20,
    padding: 30,
  },
  ringWrap: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  levelNumber: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 64,
    color: colors.yellow,
    textShadowColor: colors.yellow,
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.cyan,
    textAlign: 'center',
  },
  skillPoint: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.magenta,
    textAlign: 'center',
  },
});
