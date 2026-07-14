import * as Haptics from 'expo-haptics';
import { playTone } from './sound';

/** Completion feedback: neon synth blip + success haptic. */
export async function completionFx(soundEnabled: boolean): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics unavailable on some devices/simulators.
  }
  playTone('complete', soundEnabled);
}

export async function levelUpFx(soundEnabled: boolean): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // See above.
  }
  playTone('levelup', soundEnabled);
}

export async function unlockFx(soundEnabled: boolean): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // See above.
  }
  playTone('unlock', soundEnabled);
}

export async function errorFx(soundEnabled: boolean): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // See above.
  }
  playTone('error', soundEnabled);
}
