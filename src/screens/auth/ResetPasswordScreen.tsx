import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { AnimatedGridBackground } from '../../components/AnimatedGridBackground';
import { GlitchText } from '../../components/GlitchText';
import { NeonButton } from '../../components/NeonButton';
import { NeonInput } from '../../components/NeonInput';
import { useStore } from '../../store/useStore';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ResetPasswordScreen({ navigation }: Props) {
  const resetPassword = useStore((s) => s.resetPassword);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setFormError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unknown grid fault.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedGridBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.titleBlock}>
            <GlitchText text="RECOVERY PROTOCOL" size={22} />
            <Text style={styles.tagline}>WE’LL TRANSMIT A RESET LINK TO YOUR INBOX</Text>
          </View>

          {sent ? (
            <View style={styles.sentBlock}>
              <Text style={styles.sentText}>
                ▓▒░ TRANSMISSION SENT ░▒▓{'\n\n'}Check {email.trim()} for a password reset link, then jack back in.
              </Text>
              <NeonButton label="RETURN TO LOGIN" onPress={() => navigation.goBack()} color={colors.green} />
            </View>
          ) : (
            <>
              <NeonInput
                label="EMAIL"
                value={email}
                onChangeText={setEmail}
                placeholder="runner@night.city"
                keyboardType="email-address"
                error={emailError}
              />
              {formError ? <Text style={styles.formError}>▲ {formError}</Text> : null}
              <NeonButton label="TRANSMIT RESET LINK" onPress={handleReset} loading={loading} variant="solid" />
              <Pressable onPress={() => navigation.goBack()} style={styles.link}>
                <Text style={styles.linkText}>← BACK TO LOGIN</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 34,
    gap: 8,
  },
  tagline: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textDim,
    textAlign: 'center',
  },
  sentBlock: {
    gap: 24,
  },
  sentText: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.green,
    textAlign: 'center',
    lineHeight: 20,
  },
  formError: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.red,
    marginBottom: 14,
    textAlign: 'center',
  },
  link: {
    marginTop: 18,
    alignItems: 'center',
  },
  linkText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.cyan,
  },
});
