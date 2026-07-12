import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { NeonButton } from '../components/NeonButton';
import { NeonInput } from '../components/NeonInput';
import { SkeletonCard } from '../components/SkeletonCard';
import { useStore } from '../store/useStore';
import { ACHIEVEMENTS } from '../data/achievements';
import { canPrestige, prestigeBonus, PRESTIGE_BONUS_PER_RESET } from '../utils/prestige';
import { MAX_LEVEL } from '../utils/xp';
import {
  cancelTransmissions,
  requestNotificationPermission,
  scheduleDailyTransmission,
} from '../services/notifications';
import { FIXER_NAME } from '../data/fixer';

export function ProfileScreen() {
  const profile = useStore((s) => s.profile);
  const user = useStore((s) => s.user);
  const logOut = useStore((s) => s.logOut);
  const doPrestige = useStore((s) => s.doPrestige);
  const updateSettings = useStore((s) => s.updateSettings);
  const renameCharacter = useStore((s) => s.renameCharacter);
  const showToast = useStore((s) => s.showToast);
  const [nameDraft, setNameDraft] = useState('');
  const [editingName, setEditingName] = useState(false);

  if (!profile) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="OPERATIVE FILE" />
        <View style={{ padding: 20 }}>
          <SkeletonCard />
        </View>
      </View>
    );
  }

  const unlockedAchievements = new Set(profile.achievements);

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        showToast('Notification permission denied by OS.', 'error');
        return;
      }
      await scheduleDailyTransmission(profile.settings.notificationHour);
      showToast(`Transmissions from ${FIXER_NAME} scheduled.`, 'success');
    } else {
      await cancelTransmissions();
    }
    await updateSettings({ notificationsEnabled: value });
  };

  const handleHourChange = async (delta: number) => {
    const hour = (profile.settings.notificationHour + delta + 24) % 24;
    await updateSettings({ notificationHour: hour });
    if (profile.settings.notificationsEnabled) {
      await scheduleDailyTransmission(hour);
    }
  };

  const handlePrestige = () => {
    Alert.alert(
      'REBIRTH PROTOCOL',
      `Reset to level 1 — XP, skill points and implants wiped. You keep all gear, achievements and history, and gain a PERMANENT +${Math.round(
        PRESTIGE_BONUS_PER_RESET * 100,
      )}% XP bonus (current: +${Math.round(prestigeBonus(profile.prestigeCount) * 100)}%). Proceed?`,
      [
        { text: 'ABORT', style: 'cancel' },
        { text: 'FLATLINE ME', style: 'destructive', onPress: () => void doPrestige() },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('JACK OUT', 'End this session?', [
      { text: 'STAY', style: 'cancel' },
      { text: 'JACK OUT', style: 'destructive', onPress: () => void logOut() },
    ]);
  };

  const handleRename = async () => {
    if (nameDraft.trim().length < 2 || nameDraft.trim().length > 20) {
      showToast('Handle must be 2–20 characters.', 'error');
      return;
    }
    await renameCharacter(nameDraft);
    setEditingName(false);
    setNameDraft('');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="OPERATIVE FILE" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>REGISTERED EMAIL</Text>
          <Text style={styles.cardValue}>{user?.email ?? profile.email}</Text>
          <Text style={styles.cardLabel}>RUNNER HANDLE</Text>
          {editingName ? (
            <>
              <NeonInput label="" value={nameDraft} onChangeText={setNameDraft} placeholder={profile.character.name} autoCapitalize="characters" />
              <View style={styles.renameRow}>
                <NeonButton label="SAVE" onPress={() => void handleRename()} color={colors.green} style={styles.smallBtn} />
                <NeonButton label="CANCEL" onPress={() => setEditingName(false)} color={colors.textDim} style={styles.smallBtn} />
              </View>
            </>
          ) : (
            <Pressable onPress={() => setEditingName(true)} style={styles.renameRow}>
              <Text style={styles.cardValue}>{profile.character.name.toUpperCase()}</Text>
              <Ionicons name="pencil" size={14} color={colors.cyan} />
            </Pressable>
          )}
          <View style={styles.statLine}>
            <Text style={styles.statText}>LIFETIME: {profile.totalCompletions} contracts closed</Text>
            <Text style={styles.statText}>BEST STREAK: {profile.globalStreak.best} days</Text>
            <Text style={styles.statText}>BEST COMBO: ×{profile.bestCombo}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>▚ SETTINGS</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>SYNTH TONES</Text>
            <Switch
              value={profile.settings.soundEnabled}
              onValueChange={(v) => void updateSettings({ soundEnabled: v })}
              trackColor={{ false: colors.border, true: colors.cyan }}
              thumbColor={colors.text}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>FIXER TRANSMISSIONS</Text>
            <Switch
              value={profile.settings.notificationsEnabled}
              onValueChange={(v) => void handleNotificationToggle(v)}
              trackColor={{ false: colors.border, true: colors.magenta }}
              thumbColor={colors.text}
            />
          </View>
          {profile.settings.notificationsEnabled && (
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>
                TRANSMISSION TIME: {`${profile.settings.notificationHour}`.padStart(2, '0')}:00
              </Text>
              <View style={styles.hourButtons}>
                <Pressable onPress={() => void handleHourChange(-1)} style={styles.hourBtn} hitSlop={8}>
                  <Text style={styles.hourBtnText}>−</Text>
                </Pressable>
                <Pressable onPress={() => void handleHourChange(1)} style={styles.hourBtn} hitSlop={8}>
                  <Text style={styles.hourBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>▚ NEURAL IMPLANT REGISTRY — ACHIEVEMENTS</Text>
        <View style={styles.card}>
          {ACHIEVEMENTS.map((a) => {
            const has = unlockedAchievements.has(a.id);
            return (
              <View key={a.id} style={styles.achievementRow}>
                <Ionicons
                  // Achievement icons are curated Ionicons names; the cast narrows string → glyph union.
                  name={a.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={has ? colors.yellow : colors.textFaint}
                />
                <View style={styles.achievementBody}>
                  <Text style={[styles.achievementName, has && { color: colors.text }]}>{a.name}</Text>
                  <Text style={styles.achievementDesc}>{a.description}</Text>
                </View>
                {has ? (
                  <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                ) : (
                  <Ionicons name="lock-closed" size={14} color={colors.textFaint} />
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>▚ REBIRTH PROTOCOL</Text>
        <View style={styles.card}>
          <Text style={styles.prestigeText}>
            {canPrestige(profile.level)
              ? `LEVEL ${MAX_LEVEL} REACHED. The city has nothing left to teach this shell. Burn it down and come back sharper.`
              : `Reach level ${MAX_LEVEL} to unlock rebirth. Current prestige: ◆${profile.prestigeCount} (+${Math.round(
                  prestigeBonus(profile.prestigeCount) * 100,
                )}% permanent XP).`}
          </Text>
          <NeonButton
            label="INITIATE REBIRTH"
            onPress={handlePrestige}
            disabled={!canPrestige(profile.level)}
            color={colors.yellow}
            variant="solid"
          />
        </View>

        <NeonButton label="JACK OUT" onPress={handleLogout} color={colors.red} style={styles.logout} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  cardLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.textFaint,
  },
  cardValue: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.text,
    letterSpacing: 1,
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statLine: {
    marginTop: 6,
    gap: 2,
  },
  statText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textDim,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textDim,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.text,
  },
  hourButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  hourBtn: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: colors.magenta,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourBtnText: {
    fontFamily: fonts.mono,
    fontSize: 15,
    color: colors.magenta,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  achievementBody: {
    flex: 1,
    gap: 1,
  },
  achievementName: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textFaint,
  },
  achievementDesc: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textFaint,
  },
  prestigeText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textDim,
    lineHeight: 16,
    marginBottom: 6,
  },
  logout: {
    marginTop: 4,
  },
});
