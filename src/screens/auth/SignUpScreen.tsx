import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { AnimatedGridBackground } from '../../components/AnimatedGridBackground';
import { GlitchText } from '../../components/GlitchText';
import { NeonButton } from '../../components/NeonButton';
import { NeonInput } from '../../components/NeonInput';
import { AvatarRig } from '../../components/AvatarRig';
import { useStore } from '../../store/useStore';
import { DEFAULT_APPEARANCE, HAIR_COLORS, HAIR_STYLES, SKIN_TONES, STARTER_COSMETIC_IDS } from '../../data/cosmetics';
import type { CharacterAppearance } from '../../types';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpScreen({ navigation }: Props) {
  const signUp = useStore((s) => s.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [appearance, setAppearance] = useState<CharacterAppearance>(DEFAULT_APPEARANCE);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string | null> = {};
    next.email = EMAIL_RE.test(email.trim()) ? null : 'Enter a valid email address.';
    next.password = password.length >= 6 ? null : 'Passcode must be at least 6 characters.';
    next.confirm = confirm === password ? null : 'Passcodes do not match.';
    next.name =
      characterName.trim().length >= 2 && characterName.trim().length <= 20
        ? null
        : 'Handle must be 2–20 characters.';
    setErrors(next);
    return Object.values(next).every((v) => v === null);
  };

  const handleSignUp = async () => {
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp({ email, password, characterName, appearance });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unknown grid fault.');
      setLoading(false);
    }
  };

  const previewCharacter = {
    name: characterName || 'RUNNER',
    appearance,
    equipped: {
      outfit: STARTER_COSMETIC_IDS[0] ?? null,
      headgear: null,
      enhancement: null,
      accessory: null,
    },
    inventory: STARTER_COSMETIC_IDS,
  };

  return (
    <View style={styles.container}>
      <AnimatedGridBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.titleBlock}>
            <GlitchText text="IDENTITY FORGE" size={26} />
            <Text style={styles.tagline}>REGISTER A NEW RUNNER ON THE GRID</Text>
          </View>

          <NeonInput
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="runner@night.city"
            keyboardType="email-address"
            error={errors.email ?? null}
          />
          <NeonInput
            label="PASSCODE"
            value={password}
            onChangeText={setPassword}
            placeholder="min. 6 characters"
            secureTextEntry
            error={errors.password ?? null}
          />
          <NeonInput
            label="CONFIRM PASSCODE"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="repeat passcode"
            secureTextEntry
            error={errors.confirm ?? null}
          />
          <NeonInput
            label="RUNNER HANDLE"
            value={characterName}
            onChangeText={setCharacterName}
            placeholder="e.g. NULL_SAINT"
            autoCapitalize="characters"
            error={errors.name ?? null}
          />

          <View style={styles.previewRow}>
            <AvatarRig character={previewCharacter} size={110} />
            <View style={styles.pickers}>
              <Text style={styles.pickerLabel}>SKIN</Text>
              <View style={styles.swatchRow}>
                {SKIN_TONES.map((tone) => (
                  <Pressable
                    key={tone}
                    onPress={() => setAppearance((a) => ({ ...a, skinTone: tone }))}
                    style={[styles.swatch, { backgroundColor: tone }, appearance.skinTone === tone && styles.swatchActive]}
                  />
                ))}
              </View>
              <Text style={styles.pickerLabel}>HAIR COLOR</Text>
              <View style={styles.swatchRow}>
                {HAIR_COLORS.map((hc) => (
                  <Pressable
                    key={hc}
                    onPress={() => setAppearance((a) => ({ ...a, hairColor: hc }))}
                    style={[styles.swatch, { backgroundColor: hc }, appearance.hairColor === hc && styles.swatchActive]}
                  />
                ))}
              </View>
              <Text style={styles.pickerLabel}>HAIR STYLE</Text>
              <View style={styles.swatchRow}>
                {HAIR_STYLES.map((label, idx) => (
                  <Pressable
                    key={label}
                    onPress={() => setAppearance((a) => ({ ...a, hairStyle: idx }))}
                    style={[styles.styleChip, appearance.hairStyle === idx && styles.styleChipActive]}
                  >
                    <Text
                      style={[styles.styleChipText, appearance.hairStyle === idx && { color: colors.cyan }]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {formError ? <Text style={styles.formError}>▲ {formError}</Text> : null}

          <NeonButton label="FORGE IDENTITY" onPress={handleSignUp} loading={loading} variant="solid" color={colors.magenta} />

          <Pressable onPress={() => navigation.goBack()} style={styles.link}>
            <Text style={styles.linkText}>← BACK TO LOGIN</Text>
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
    padding: 28,
    paddingTop: 70,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  tagline: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textDim,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
  },
  pickers: {
    flex: 1,
    gap: 6,
  },
  pickerLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.textDim,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: colors.text,
  },
  styleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  styleChipActive: {
    borderColor: colors.cyan,
  },
  styleChipText: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.textDim,
    letterSpacing: 1,
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
    marginBottom: 30,
  },
  linkText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.cyan,
  },
});
