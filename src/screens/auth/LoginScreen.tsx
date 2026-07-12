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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ navigation }: Props) {
  const logIn = useStore((s) => s.logIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    let ok = true;
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      ok = false;
    } else {
      setEmailError(null);
    }
    if (password.length < 6) {
      setPasswordError('Passcode must be at least 6 characters.');
      ok = false;
    } else {
      setPasswordError(null);
    }
    return ok;
  };

  const handleLogin = async () => {
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await logIn(email, password);
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
            <GlitchText text="GRIDRUNNER" size={34} intense />
            <Text style={styles.tagline}>HACK THE CITY. ONE HABIT AT A TIME.</Text>
          </View>

          <NeonInput
            label="EMAIL // HANDLE"
            value={email}
            onChangeText={setEmail}
            placeholder="runner@night.city"
            keyboardType="email-address"
            error={emailError}
          />
          <NeonInput
            label="PASSCODE"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={passwordError}
          />

          {formError ? <Text style={styles.formError}>▲ {formError}</Text> : null}

          <NeonButton label="JACK IN" onPress={handleLogin} loading={loading} variant="solid" />

          <Pressable onPress={() => navigation.navigate('ResetPassword')} style={styles.link}>
            <Text style={styles.linkText}>PASSCODE LOST? RUN RECOVERY</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('SignUp')} style={styles.link}>
            <Text style={[styles.linkText, { color: colors.magenta }]}>NEW RUNNER? CREATE AN IDENTITY →</Text>
          </Pressable>
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
    marginBottom: 40,
    gap: 10,
  },
  tagline: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textDim,
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
