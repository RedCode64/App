import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { NeonButton } from './NeonButton';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Global crash screen: catches unhandled render errors app-wide. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('GRIDRUNNER fatal render error:', error, info.componentStack);
  }

  private readonly reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.glyph}>▓▒░ FATAL EXCEPTION ░▒▓</Text>
          <Text style={styles.title}>SYSTEM CRASH</Text>
          <Text style={styles.subtitle}>
            The grid threw an exception it couldn’t contain. Your data is safe in the vault — reboot the interface to
            continue.
          </Text>
          <ScrollView style={styles.traceBox}>
            <Text style={styles.trace}>{this.state.error.message}</Text>
          </ScrollView>
          <NeonButton label="REBOOT INTERFACE" onPress={this.reset} color={colors.magenta} variant="solid" />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: 28,
    gap: 16,
  },
  glyph: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.red,
    letterSpacing: 2,
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 30,
    color: colors.red,
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 20,
  },
  traceBox: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 10,
    backgroundColor: colors.bgElevated,
  },
  trace: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textFaint,
  },
});
