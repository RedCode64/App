import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, tierColors, tierLabels } from '../theme';
import { AnimatedGridBackground } from '../components/AnimatedGridBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { AvatarRig } from '../components/AvatarRig';
import { SkeletonCard } from '../components/SkeletonCard';
import { NeonButton } from '../components/NeonButton';
import { useStore } from '../store/useStore';
import { unlockFx } from '../services/fx';
import { COSMETICS, HAIR_COLORS, SKIN_TONES } from '../data/cosmetics';
import { achievementById } from '../data/achievements';
import { equippedGearMultiplier, overallGearTier, GEAR_SLOTS, TIER_MULTIPLIER } from '../utils/gear';
import type { Cosmetic, CosmeticSlot, UnlockCondition } from '../types';

const SLOT_LABELS: Record<CosmeticSlot, string> = {
  outfit: 'OUTFIT',
  headgear: 'HEADGEAR',
  enhancement: 'CYBERWARE',
  accessory: 'ACCESSORY',
};

function unlockHint(cond: UnlockCondition): string {
  switch (cond.type) {
    case 'starter':
      return 'Starter gear';
    case 'level':
      return `Reach level ${cond.level}`;
    case 'streak':
      return `Hold a ${cond.days}-day streak`;
    case 'prestige':
      return `Prestige ×${cond.count}`;
    case 'achievement':
      return `Earn: ${achievementById(cond.achievementId)?.name ?? cond.achievementId}`;
    case 'fragments':
      return `Fabricate for ${cond.cost} fragments`;
  }
}

export function CharacterScreen() {
  const profile = useStore((s) => s.profile);
  const equipCosmetic = useStore((s) => s.equipCosmetic);
  const craftCosmetic = useStore((s) => s.craftCosmetic);
  const updateAppearance = useStore((s) => s.updateAppearance);
  const [activeSlot, setActiveSlot] = useState<CosmeticSlot>('outfit');
  const [showAppearance, setShowAppearance] = useState(false);

  if (!profile) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="THE RIG" />
        <View style={{ padding: 20 }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  const { character } = profile;
  const gearMult = equippedGearMultiplier(character.equipped, COSMETICS);
  const tier = overallGearTier(gearMult);
  const owned = new Set(character.inventory);
  const slotItems = COSMETICS.filter((c) => c.slot === activeSlot);

  const handleEquip = (cosmetic: Cosmetic) => {
    const isEquipped = character.equipped[cosmetic.slot] === cosmetic.id;
    void unlockFx(profile.settings.soundEnabled);
    void equipCosmetic(cosmetic.slot, isEquipped ? null : cosmetic.id);
  };

  const handleCraft = (cosmetic: Cosmetic) => {
    void craftCosmetic(cosmetic.id).then((ok) => {
      if (ok) void unlockFx(profile.settings.soundEnabled);
    });
  };

  return (
    <View style={styles.container}>
      <AnimatedGridBackground />
      <ScreenHeader
        title="THE RIG"
        right={
          <Pressable onPress={() => setShowAppearance((v) => !v)} hitSlop={10}>
            <Ionicons name="color-palette" size={20} color={showAppearance ? colors.magenta : colors.textDim} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarCard}>
          <AvatarRig character={character} size={150} />
          <View style={styles.avatarInfo}>
            <Text style={styles.name}>{character.name.toUpperCase()}</Text>
            <View style={[styles.tierBadge, { borderColor: tierColors[tier] }]}>
              <Text style={[styles.tierText, { color: tierColors[tier] }]}>
                {tierLabels[tier]} TIER — ×{gearMult.toFixed(2)} IDLE REWARDS
              </Text>
            </View>
            <Text style={styles.tierHint}>
              Better equipped gear raises your Ghost Protocol reward multiplier: STREET ×1 → CHROME ×1.25 → NETRUNNER
              ×1.5 → GHOST ×2.
            </Text>
            <Text style={styles.fragments}>◆ {profile.fragments} COSMETIC FRAGMENTS</Text>
          </View>
        </View>

        {showAppearance && (
          <View style={styles.appearanceCard}>
            <Text style={styles.sectionTitle}>▚ RECALIBRATE APPEARANCE</Text>
            <Text style={styles.pickerLabel}>SKIN</Text>
            <View style={styles.swatchRow}>
              {SKIN_TONES.map((tone) => (
                <Pressable
                  key={tone}
                  onPress={() => void updateAppearance({ skinTone: tone })}
                  style={[
                    styles.swatch,
                    { backgroundColor: tone },
                    character.appearance.skinTone === tone && styles.swatchActive,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.pickerLabel}>HAIR COLOR</Text>
            <View style={styles.swatchRow}>
              {HAIR_COLORS.map((hc) => (
                <Pressable
                  key={hc}
                  onPress={() => void updateAppearance({ hairColor: hc })}
                  style={[
                    styles.swatch,
                    { backgroundColor: hc },
                    character.appearance.hairColor === hc && styles.swatchActive,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.pickerLabel}>HAIR STYLE</Text>
            <View style={styles.swatchRow}>
              {[0, 1, 2, 3].map((idx) => (
                <NeonButton
                  key={idx}
                  label={`${idx + 1}`}
                  onPress={() => void updateAppearance({ hairStyle: idx })}
                  color={character.appearance.hairStyle === idx ? colors.cyan : colors.textFaint}
                  style={styles.hairBtn}
                />
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>▚ GEAR SLOTS</Text>
        <View style={styles.slotRow}>
          {GEAR_SLOTS.map((slot) => {
            const equippedId = character.equipped[slot];
            const item = equippedId ? COSMETICS.find((c) => c.id === equippedId) : undefined;
            const active = activeSlot === slot;
            return (
              <Pressable
                key={slot}
                onPress={() => setActiveSlot(slot)}
                style={[styles.slotTile, active && { borderColor: colors.cyan }]}
              >
                <Text style={[styles.slotLabel, active && { color: colors.cyan }]}>{SLOT_LABELS[slot]}</Text>
                <Text style={[styles.slotItem, item && { color: tierColors[item.tier] }]} numberOfLines={2}>
                  {item ? item.name : '— EMPTY —'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>▚ INVENTORY — {SLOT_LABELS[activeSlot]}</Text>
        {slotItems.map((cosmetic) => {
          const isOwned = owned.has(cosmetic.id);
          const isEquipped = character.equipped[cosmetic.slot] === cosmetic.id;
          const craftable =
            !isOwned && cosmetic.unlock.type === 'fragments' && profile.fragments >= cosmetic.unlock.cost;
          return (
            <View key={cosmetic.id} style={[styles.itemCard, isEquipped && { borderColor: tierColors[cosmetic.tier] }]}>
              <View style={styles.itemBody}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemName, !isOwned && { color: colors.textFaint }]}>{cosmetic.name}</Text>
                  <Text style={[styles.itemTier, { color: tierColors[cosmetic.tier] }]}>
                    {tierLabels[cosmetic.tier]} ×{TIER_MULTIPLIER[cosmetic.tier]}
                  </Text>
                </View>
                <Text style={styles.itemLore}>{cosmetic.lore}</Text>
                {!isOwned && <Text style={styles.itemUnlock}>🔒 {unlockHint(cosmetic.unlock)}</Text>}
              </View>
              {isOwned ? (
                <NeonButton
                  label={isEquipped ? 'UNEQUIP' : 'EQUIP'}
                  onPress={() => handleEquip(cosmetic)}
                  color={isEquipped ? colors.textDim : tierColors[cosmetic.tier]}
                  style={styles.itemBtn}
                />
              ) : craftable ? (
                <NeonButton
                  label="FABRICATE"
                  onPress={() => handleCraft(cosmetic)}
                  color={colors.magenta}
                  style={styles.itemBtn}
                />
              ) : (
                <Ionicons name="lock-closed" size={18} color={colors.textFaint} />
              )}
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>▚ GHOST PROTOCOL — MISSION LOG</Text>
        {profile.idleMissionLog.length === 0 ? (
          <Text style={styles.emptyLog}>
            No idle missions on record. Close the app for a few hours — your runner keeps working the streets while
            you’re gone.
          </Text>
        ) : (
          profile.idleMissionLog.map((entry) => (
            <View key={entry.id} style={styles.logRow}>
              <Text style={styles.logTitle} numberOfLines={1}>
                {entry.title}
              </Text>
              <Text style={styles.logReward}>
                +{entry.xp} XP{entry.fragments > 0 ? ` · ◆${entry.fragments}` : ''}
                {entry.shield ? ' · 🛡' : ''}
              </Text>
            </View>
          ))
        )}
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
  avatarCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  avatarInfo: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  name: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 2,
    color: colors.text,
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  tierText: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 1,
  },
  tierHint: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textFaint,
    lineHeight: 13,
  },
  fragments: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.magenta,
    letterSpacing: 1,
  },
  appearanceCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.magenta,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    gap: 6,
  },
  pickerLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.textDim,
    marginTop: 4,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: colors.text,
  },
  hairBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textDim,
    marginBottom: 10,
    marginTop: 8,
  },
  slotRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  slotTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 8,
    backgroundColor: colors.bgCard,
    gap: 4,
    minHeight: 64,
  },
  slotLabel: {
    fontFamily: fonts.mono,
    fontSize: 7,
    letterSpacing: 1,
    color: colors.textFaint,
  },
  slotItem: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.textDim,
    lineHeight: 11,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  itemBody: {
    flex: 1,
    gap: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemName: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 12,
    color: colors.text,
    letterSpacing: 1,
    flexShrink: 1,
  },
  itemTier: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
  },
  itemLore: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textDim,
    lineHeight: 14,
  },
  itemUnlock: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.yellow,
  },
  itemBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  emptyLog: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textDim,
    lineHeight: 16,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  logTitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textDim,
    flex: 1,
  },
  logReward: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.cyan,
  },
});
