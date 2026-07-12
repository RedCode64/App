import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { NeonSpinner } from '../components/NeonSpinner';
import { ErrorState } from '../components/ErrorState';
import { useStore } from '../store/useStore';
import { fetchLeaderboard, type LeaderboardResult } from '../data/leaderboard';

/** Global net-runner rankings (mocked backend with real loading/error states). */
export function LeaderboardScreen() {
  const profile = useStore((s) => s.profile);
  const [result, setResult] = useState<LeaderboardResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard({
        handle: profile?.character.name ?? 'YOU',
        xp: profile?.xp ?? 0,
        prestige: profile?.prestigeCount ?? 0,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The grid rejected the query.');
    } finally {
      setLoading(false);
    }
  }, [profile?.character.name, profile?.xp, profile?.prestigeCount]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="THE NET" />
      {loading ? (
        <NeonSpinner label="QUERYING THE GRID…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : result ? (
        <>
          <Text style={styles.rankBanner}>YOUR RANK: #{result.yourRank} OF {result.entries.length} NET RUNNERS</Text>
          <FlatList
            data={result.entries}
            keyExtractor={(e) => e.handle}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={() => void load()}
            renderItem={({ item, index }) => (
              <View style={[styles.row, item.isYou === true && styles.youRow]}>
                <Text style={[styles.rank, index < 3 && { color: colors.yellow }]}>#{index + 1}</Text>
                <View style={styles.handleCol}>
                  <Text style={[styles.handle, item.isYou === true && { color: colors.cyan }]} numberOfLines={1}>
                    {item.handle}
                    {item.isYou === true ? '  ◄ YOU' : ''}
                  </Text>
                  <Text style={styles.meta}>
                    LVL {item.level}
                    {item.prestige > 0 ? `  ◆${item.prestige}` : ''}
                  </Text>
                </View>
                <Text style={styles.xp}>{item.xp.toLocaleString()} XP</Text>
              </View>
            )}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  rankBanner: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.magenta,
    textAlign: 'center',
    paddingVertical: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  youRow: {
    borderColor: colors.cyan,
    backgroundColor: '#00f0ff10',
  },
  rank: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 13,
    color: colors.textDim,
    width: 40,
  },
  handleCol: {
    flex: 1,
    gap: 2,
  },
  handle: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 13,
    color: colors.text,
    letterSpacing: 1,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textFaint,
  },
  xp: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.cyan,
  },
});
