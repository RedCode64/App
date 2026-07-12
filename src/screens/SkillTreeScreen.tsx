import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { NeonButton } from '../components/NeonButton';
import { SkeletonCard } from '../components/SkeletonCard';
import { useStore } from '../store/useStore';
import { unlockFx } from '../services/fx';
import { SKILL_TREE } from '../data/skillTree';
import { canUnlockSkill } from '../utils/skills';
import type { SkillBranch, SkillNode } from '../types';

const BRANCH_COLORS: Record<SkillBranch, string> = {
  core: colors.text,
  cortex: colors.cyan,
  reflex: colors.yellow,
  firmware: colors.green,
  ghost: colors.magenta,
};

const CANVAS_W = 360;
const CANVAS_H = 540;

/** Neural implant upgrade paths — a branching node graph rendered in SVG. */
export function SkillTreeScreen() {
  const profile = useStore((s) => s.profile);
  const unlockSkill = useStore((s) => s.unlockSkill);
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!profile) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="IMPLANTS" />
        <View style={{ padding: 20 }}>
          <SkeletonCard />
        </View>
      </View>
    );
  }

  const scale = (width - 24) / CANVAS_W;
  const unlocked = new Set(profile.unlockedSkills);
  const selected = selectedId ? SKILL_TREE.find((n) => n.id === selectedId) ?? null : null;
  const selectedCheck = selected ? canUnlockSkill(selected, profile.unlockedSkills, profile.skillPoints) : null;

  const nodeState = (node: SkillNode): 'unlocked' | 'available' | 'locked' => {
    if (unlocked.has(node.id)) return 'unlocked';
    if (node.parent === null || unlocked.has(node.parent)) return 'available';
    return 'locked';
  };

  const handleInstall = () => {
    if (!selected) return;
    void unlockSkill(selected.id).then((ok) => {
      if (ok) void unlockFx(profile.settings.soundEnabled);
    });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="IMPLANTS"
        right={<Text style={styles.points}>SP: {profile.skillPoints}</Text>}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Svg width={CANVAS_W * scale} height={CANVAS_H * scale} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
          {/* Edges */}
          {SKILL_TREE.map((node) => {
            if (node.parent === null) return null;
            const parent = SKILL_TREE.find((n) => n.id === node.parent);
            if (!parent) return null;
            const lit = unlocked.has(node.id);
            return (
              <Line
                key={`edge-${node.id}`}
                x1={parent.x}
                y1={parent.y}
                x2={node.x}
                y2={node.y}
                stroke={lit ? BRANCH_COLORS[node.branch] : colors.border}
                strokeWidth={lit ? 2.5 : 1.5}
                strokeDasharray={lit ? undefined : '4 4'}
              />
            );
          })}
          {/* Nodes */}
          {SKILL_TREE.map((node) => {
            const state = nodeState(node);
            const color = BRANCH_COLORS[node.branch];
            const isSelected = selectedId === node.id;
            return (
              <G key={node.id} onPress={() => setSelectedId(node.id)}>
                {isSelected && <Circle cx={node.x} cy={node.y} r={26} fill="none" stroke={color} strokeWidth={1} opacity={0.6} />}
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r={19}
                  fill={state === 'unlocked' ? `${color}33` : colors.bgCard}
                  stroke={state === 'locked' ? colors.border : color}
                  strokeWidth={state === 'unlocked' ? 3 : 1.5}
                  opacity={state === 'locked' ? 0.55 : 1}
                />
                <SvgText
                  x={node.x}
                  y={node.y + 4}
                  fontSize={11}
                  fontWeight="bold"
                  fill={state === 'locked' ? colors.textFaint : color}
                  textAnchor="middle"
                >
                  {state === 'unlocked' ? '✓' : node.cost}
                </SvgText>
                <SvgText
                  x={node.x}
                  y={node.y + 34}
                  fontSize={7}
                  fill={state === 'locked' ? colors.textFaint : colors.textDim}
                  textAnchor="middle"
                >
                  {node.name}
                </SvgText>
              </G>
            );
          })}
        </Svg>

        <View style={styles.detailPanel}>
          {selected ? (
            <>
              <Text style={[styles.detailName, { color: BRANCH_COLORS[selected.branch] }]}>{selected.name}</Text>
              <Text style={styles.detailDesc}>{selected.description}</Text>
              <Text style={styles.detailCost}>COST: {selected.cost} SKILL POINT{selected.cost > 1 ? 'S' : ''}</Text>
              {unlocked.has(selected.id) ? (
                <Text style={styles.installed}>✓ INSTALLED</Text>
              ) : (
                <>
                  {selectedCheck && !selectedCheck.ok && selectedCheck.reason !== null && (
                    <Text style={styles.blocked}>▲ {selectedCheck.reason}</Text>
                  )}
                  <NeonButton
                    label="INSTALL IMPLANT"
                    onPress={handleInstall}
                    disabled={selectedCheck === null || !selectedCheck.ok}
                    color={BRANCH_COLORS[selected.branch]}
                    variant="solid"
                  />
                </>
              )}
            </>
          ) : (
            <Text style={styles.detailHint}>
              Tap a node to inspect the implant. Earn skill points by leveling up; branches: CORTEX (XP) · REFLEX
              (combos) · FIRMWARE (streak shields) · GHOST (idle missions).
            </Text>
          )}
        </View>
        <View style={{ height: 30 }} />
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
    padding: 12,
    alignItems: 'center',
  },
  points: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
    color: colors.yellow,
  },
  detailPanel: {
    alignSelf: 'stretch',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: 8,
    padding: 16,
    gap: 8,
    marginTop: 4,
  },
  detailName: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 2,
  },
  detailDesc: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textDim,
    lineHeight: 17,
  },
  detailCost: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.yellow,
  },
  installed: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 2,
    color: colors.green,
  },
  blocked: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.red,
  },
  detailHint: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textDim,
    lineHeight: 17,
  },
});
