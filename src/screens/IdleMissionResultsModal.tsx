import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, tierColors, tierLabels } from '../theme';
import { GlitchText } from '../components/GlitchText';
import { NeonButton } from '../components/NeonButton';
import { Scanlines } from '../components/Scanlines';
import { useStore } from '../store/useStore';
import { overallGearTier } from '../utils/gear';

/**
 * Ghost Protocol debrief: shown on app open after a session gap, listing what
 * the character accomplished autonomously and the loot earned.
 */
export function IdleMissionResultsModal() {
  const report = useStore((s) => s.idleReport);
  const dismiss = useStore((s) => s.dismissIdleReport);

  if (!report) return null;

  const tier = overallGearTier(report.gearMultiplier);

  return (
    <Modal transparent animationType="slide" visible onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Scanlines height={90} />
          <View style={styles.header}>
            <GlitchText text="GHOST PROTOCOL" size={22} color={colors.magenta} />
            <Text style={styles.subheader}>
              DEBRIEF — YOUR RUNNER WORKED THE STREETS FOR {report.hoursAway}H WHILE YOU WERE OFFLINE
            </Text>
          </View>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {report.missions.map((mission, idx) => (
              <Animated.View key={mission.id} entering={FadeInDown.delay(idx * 120).duration(300)} style={styles.missionRow}>
                <Ionicons
                  name={mission.shield ? 'shield-checkmark' : 'flash'}
                  size={16}
                  color={mission.shield ? colors.green : colors.cyan}
                />
                <View style={styles.missionBody}>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <Text style={styles.missionReward}>
                    +{mission.xp} XP
                    {mission.fragments > 0 ? `  ·  ◆${mission.fragments} fragments` : ''}
                    {mission.shield ? '  ·  STREAK SHIELD RECOVERED' : ''}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </ScrollView>

          <View style={styles.totals}>
            <Text style={[styles.tierNote, { color: tierColors[tier] }]}>
              GEAR TIER {tierLabels[tier]} — REWARD MULTIPLIER ×{report.gearMultiplier.toFixed(2)}
            </Text>
            <View style={styles.totalsRow}>
              <TotalTile label="XP" value={`+${report.totalXp}`} color={colors.cyan} />
              <TotalTile label="FRAGMENTS" value={`+${report.totalFragments}`} color={colors.magenta} />
              <TotalTile label="SHIELDS" value={`+${report.shieldsGained}`} color={colors.green} />
            </View>
            <NeonButton label="JACK BACK IN" onPress={dismiss} color={colors.magenta} variant="solid" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TotalTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.totalTile, { borderColor: color }]}>
      <Text style={[styles.totalValue, { color }]}>{value}</Text>
      <Text style={styles.totalLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#03040add',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopWidth: 2,
    borderTopColor: colors.magenta,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    gap: 8,
  },
  subheader: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.textDim,
    lineHeight: 14,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  missionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
  },
  missionBody: {
    flex: 1,
    gap: 3,
  },
  missionTitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.text,
    lineHeight: 15,
  },
  missionReward: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textDim,
  },
  totals: {
    padding: 20,
    gap: 12,
  },
  tierNote: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'center',
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  totalTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
  },
  totalValue: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 16,
  },
  totalLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: colors.textFaint,
    marginTop: 2,
  },
});
