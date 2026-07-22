import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { parseTime } from "@/lib/utils";

/**
 * Notification system (Expo Notifications).
 * Handles daily practice reminders and streak nudges. All scheduling is local
 * (no push server required), keeping the app fully offline-first.
 */

// Foreground presentation behavior.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  let granted =
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted =
      req.granted ||
      req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Practice Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#FF9500",
    });
  }

  return granted;
}

/**
 * Schedule a daily repeating reminder for a routine at "HH:mm".
 * Returns the notification identifier (store it on the routine to cancel later).
 */
export async function scheduleDailyReminder(opts: {
  mudraName: string;
  time: string;
  routineId: string;
}): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const { hour, minute } = parseTime(opts.time);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time for ${opts.mudraName} practice`,
      body: "A few mindful minutes keep your streak alive. 🧘",
      data: { routineId: opts.routineId, type: "practice" },
      ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

/** One-off streak nudge (e.g. "Keep your streak alive") later today. */
export async function scheduleStreakReminder(opts: {
  mudraName: string;
  inSeconds: number;
}): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Keep your streak alive 🔥",
      body: `You haven't practiced ${opts.mudraName} today. Tap to begin.`,
      data: { type: "streak" },
      ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(60, opts.inSeconds),
    },
  });
}

export async function cancelReminder(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // already gone — ignore
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function updateNotificationTime(opts: {
  time: string;
}): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const { hour, minute } = parseTime(opts.time);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Mudra Practice Time 🧘",
      body: "It's time for your daily mindful practice. Keep your streak alive!",
      data: { type: "Daily" },
      ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}