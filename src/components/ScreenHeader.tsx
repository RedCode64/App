import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { GlitchText } from './GlitchText';
import { Scanlines } from './Scanlines';

interface ScreenHeaderProps {
  title: string;
  right?: ReactNode;
}

/** Standard header: glitch title over a scanline texture. */
export function ScreenHeader({ title, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Scanlines height={insets.top + 70} />
      <View style={styles.row}>
        <GlitchText text={title} size={20} />
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBright,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
