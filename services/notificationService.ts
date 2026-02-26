import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const SESSION_NOTIFICATION_ID = 'session-notification';
const CHANNEL_ID = 'session-channel';

class NotificationService {
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Create Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'Session Updates',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#CC9B7A',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
        });
      }

      // Set up notification action categories for lock screen controls
      try {
        await Notifications.setNotificationCategoryAsync('session-active', [
          {
            identifier: 'pause',
            buttonTitle: 'Pause',
            options: { opensAppToForeground: false },
          },
        ]);
        await Notifications.setNotificationCategoryAsync('session-paused', [
          {
            identifier: 'resume',
            buttonTitle: 'Resume',
            options: { opensAppToForeground: false },
          },
          {
            identifier: 'end',
            buttonTitle: 'End Session',
            options: { opensAppToForeground: true },
          },
        ]);
      } catch {
        // Action categories not supported on this platform/version
      }

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async startSessionNotification(
    timer: string,
    affirmation: string,
    distance: string = ''
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: SESSION_NOTIFICATION_ID,
        content: {
          title: affirmation || 'Session Active',
          body: `⏱ ${timer}${distance ? `  📍 ${distance}` : ''}`,
          sticky: true,
          autoDismiss: false,
          categoryIdentifier: 'session-active',
          ...(Platform.OS === 'android' && {
            priority: 'high',
          }),
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to start session notification:', error);
    }
  }

  async updateNotification(
    timer: string,
    affirmation: string,
    isPaused = false,
    distance: string = ''
  ): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await Notifications.dismissNotificationAsync(SESSION_NOTIFICATION_ID);

      const timerDisplay = isPaused ? `${timer} (Paused)` : timer;

      await Notifications.scheduleNotificationAsync({
        identifier: SESSION_NOTIFICATION_ID,
        content: {
          title: affirmation || (isPaused ? 'Session Paused' : 'Session Active'),
          body: `⏱ ${timerDisplay}${distance ? `  📍 ${distance}` : ''}`,
          sticky: true,
          autoDismiss: false,
          categoryIdentifier: isPaused ? 'session-paused' : 'session-active',
          ...(Platform.OS === 'android' && {
            priority: 'high',
          }),
        },
        trigger: null,
      });
    } catch {
      // Silently fail on update errors to avoid spam
    }
  }

  async stopSessionNotification(): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(SESSION_NOTIFICATION_ID);
    } catch (error) {
      console.error('Failed to stop session notification:', error);
    }
  }
}

export const notificationService = new NotificationService();
