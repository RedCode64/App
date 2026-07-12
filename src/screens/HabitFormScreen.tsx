import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { categoryColors, categoryLabels, colors, fonts } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { NeonButton } from '../components/NeonButton';
import { NeonInput } from '../components/NeonInput';
import { useStore } from '../store/useStore';
import type { Frequency, HabitCategory } from '../types';
import type { ContractsStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ContractsStackParamList, 'ContractForm'>;

const CATEGORIES: HabitCategory[] = ['body', 'mind', 'grind', 'social'];
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
type FrequencyKind = Frequency['type'];

export function HabitFormScreen({ navigation, route }: Props) {
  const habits = useStore((s) => s.habits);
  const createHabit = useStore((s) => s.createHabit);
  const updateHabit = useStore((s) => s.updateHabit);
  const deleteHabit = useStore((s) => s.deleteHabit);

  const editing = route.params?.habitId ? habits.find((h) => h.id === route.params.habitId) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [category, setCategory] = useState<HabitCategory>(editing?.category ?? 'body');
  const [freqKind, setFreqKind] = useState<FrequencyKind>(editing?.frequency.type ?? 'daily');
  const [timesPerWeek, setTimesPerWeek] = useState(
    editing?.frequency.type === 'weekly' ? editing.frequency.timesPerWeek : 3,
  );
  const [days, setDays] = useState<number[]>(
    editing?.frequency.type === 'specificDays' ? editing.frequency.days : [1, 3, 5],
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [daysError, setDaysError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const buildFrequency = (): Frequency => {
    if (freqKind === 'weekly') return { type: 'weekly', timesPerWeek };
    if (freqKind === 'specificDays') return { type: 'specificDays', days };
    return { type: 'daily' };
  };

  const handleSave = async () => {
    let ok = true;
    if (name.trim().length < 2 || name.trim().length > 40) {
      setNameError('Contract name must be 2–40 characters.');
      ok = false;
    } else {
      setNameError(null);
    }
    if (freqKind === 'specificDays' && days.length === 0) {
      setDaysError('Select at least one day.');
      ok = false;
    } else {
      setDaysError(null);
    }
    if (!ok) return;

    setSaving(true);
    const payload = { name, description, category, frequency: buildFrequency() };
    if (editing) {
      await updateHabit(editing.id, payload);
    } else {
      await createHabit(payload);
    }
    setSaving(false);
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert('TERMINATE CONTRACT', `Permanently delete "${editing.name}" and its history?`, [
      { text: 'ABORT', style: 'cancel' },
      {
        text: 'TERMINATE',
        style: 'destructive',
        onPress: () => {
          void deleteHabit(editing.id).then(() => navigation.goBack());
        },
      },
    ]);
  };

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={editing ? 'EDIT CONTRACT' : 'NEW CONTRACT'} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <NeonInput
          label="CONTRACT NAME"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Morning run through the sprawl"
          autoCapitalize="sentences"
          error={nameError}
        />
        <NeonInput
          label="BRIEFING (OPTIONAL)"
          value={description}
          onChangeText={setDescription}
          placeholder="Mission details…"
          autoCapitalize="sentences"
          multiline
        />

        <Text style={styles.label}>DISTRICT</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            const color = categoryColors[cat];
            return (
              <Pressable key={cat} onPress={() => setCategory(cat)} style={[styles.chip, active && { borderColor: color }]}>
                <Text style={[styles.chipText, active && { color }]}>{categoryLabels[cat]}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>FREQUENCY</Text>
        <View style={styles.chipRow}>
          {(
            [
              ['daily', 'EVERY CYCLE'],
              ['weekly', 'X PER WEEK'],
              ['specificDays', 'SPECIFIC DAYS'],
            ] as [FrequencyKind, string][]
          ).map(([kind, label]) => {
            const active = freqKind === kind;
            return (
              <Pressable key={kind} onPress={() => setFreqKind(kind)} style={[styles.chip, active && { borderColor: colors.cyan }]}>
                <Text style={[styles.chipText, active && { color: colors.cyan }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {freqKind === 'weekly' && (
          <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>TARGET: {timesPerWeek}× PER WEEK</Text>
            <View style={styles.stepperButtons}>
              <Pressable
                onPress={() => setTimesPerWeek((n) => Math.max(1, n - 1))}
                style={styles.stepperBtn}
                hitSlop={8}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <Pressable
                onPress={() => setTimesPerWeek((n) => Math.min(7, n + 1))}
                style={styles.stepperBtn}
                hitSlop={8}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        )}

        {freqKind === 'specificDays' && (
          <>
            <View style={styles.chipRow}>
              {DAY_NAMES.map((dayName, idx) => {
                const active = days.includes(idx);
                return (
                  <Pressable key={dayName} onPress={() => toggleDay(idx)} style={[styles.dayChip, active && styles.dayChipActive]}>
                    <Text style={[styles.chipText, active && { color: colors.magenta }]}>{dayName}</Text>
                  </Pressable>
                );
              })}
            </View>
            {daysError ? <Text style={styles.error}>▲ {daysError}</Text> : null}
          </>
        )}

        <View style={styles.actions}>
          <NeonButton
            label={editing ? 'UPDATE CONTRACT' : 'REGISTER CONTRACT'}
            onPress={() => void handleSave()}
            loading={saving}
            variant="solid"
          />
          <NeonButton label="CANCEL" onPress={() => navigation.goBack()} color={colors.textDim} />
          {editing && <NeonButton label="TERMINATE CONTRACT" onPress={handleDelete} color={colors.red} />}
        </View>
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
    paddingBottom: 60,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textDim,
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.textFaint,
  },
  dayChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dayChipActive: {
    borderColor: colors.magenta,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepperLabel: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.text,
  },
  stepperButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.cyan,
  },
  error: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.red,
    marginBottom: 12,
  },
  actions: {
    gap: 12,
    marginTop: 12,
  },
});
