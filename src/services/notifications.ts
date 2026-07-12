import * as Notifications from 'expo-notifications';
import { FIXER_NAME, randomTransmission } from '../data/fixer';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const request = await Notifications.requestPermissionsAsync();
    return request.granted;
  } catch {
    return false;
  }
}

/**
 * Schedules the daily "incoming transmission" from the fixer at the given
 * hour. Any previously scheduled transmissions are replaced.
 */
export async function scheduleDailyTransmission(hour: number): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `▓▒░ INCOMING TRANSMISSION — ${FIXER_NAME}`,
      body: randomTransmission(),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
}

export async function cancelTransmissions(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing scheduled or permissions revoked — either way we're done.
  }
}
