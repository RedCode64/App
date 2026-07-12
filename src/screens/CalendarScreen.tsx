import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { useStore } from '../store/useStore';
import { completionsInMonth } from '../utils/streaks';
import { todayKey } from '../utils/dates';

const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];
const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Habit history as a neon intensity grid — brighter cells = more completions. */
export function CalendarScreen() {
  const habits = useStore((s) => s.habits);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const counts = completionsInMonth(habits, year, month);
  const maxCount = Math.max(1, ...counts.values());
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayKey();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="SIGNAL HISTORY" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.monthNav}>
          <Pressable onPress={prevMonth} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.cyan} />
          </Pressable>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <Pressable onPress={nextMonth} hitSlop={12}>
            <Ionicons name="chevron-forward" size={22} color={colors.cyan} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {DAY_HEADERS.map((d, i) => (
            <View key={`h${i}`} style={styles.cell}>
              <Text style={styles.dayHeader}>{d}</Text>
            </View>
          ))}
          {cells.map((day, idx) => {
            if (day === null) {
              return <View key={`e${idx}`} style={styles.cell} />;
            }
            const key = `${year}-${`${month + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
            const count = counts.get(key) ?? 0;
            const intensity = count / maxCount;
            const isToday = key === today;
            return (
              <View key={key} style={styles.cell}>
                <View
                  style={[
                    styles.dayBox,
                    count > 0 && {
                      backgroundColor: `rgba(0, 240, 255, ${0.15 + intensity * 0.6})`,
                      borderColor: colors.cyan,
                    },
                    isToday && styles.todayBox,
                  ]}
                >
                  <Text style={[styles.dayText, count > 0 && { color: colors.text }]}>{day}</Text>
                  {count > 0 && <Text style={styles.countText}>{count}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendText}>DIM</Text>
          {[0.15, 0.35, 0.55, 0.75].map((op) => (
            <View key={op} style={[styles.legendBox, { backgroundColor: `rgba(0, 240, 255, ${op})` }]} />
          ))}
          <Text style={styles.legendText}>BRIGHT — completions per day</Text>
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
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  monthLabel: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 3,
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    marginBottom: 8,
  },
  dayHeader: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textFaint,
  },
  dayBox: {
    width: 38,
    height: 38,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  todayBox: {
    borderColor: colors.yellow,
    borderWidth: 2,
  },
  dayText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textFaint,
  },
  countText: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.cyan,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textFaint,
  },
});
