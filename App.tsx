import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ToastHost } from './src/components/Toast';
import { GlitchOverlay } from './src/components/GlitchOverlay';
import { LevelUpOverlay } from './src/screens/LevelUpOverlay';
import { IdleMissionResultsModal } from './src/screens/IdleMissionResultsModal';
import { RootNavigator } from './src/navigation';
import { useStore } from './src/store/useStore';
import { todayKey } from './src/utils/dates';

const PENDING_FLUSH_INTERVAL_MS = 20 * 1000;
const SESSION_CHECK_INTERVAL_MS = 60 * 1000;

export default function App() {
  const initAuth = useStore((s) => s.initAuth);
  const user = useStore((s) => s.user);
  const hydrated = useStore((s) => s.hydrated);
  const sessionChecked = useRef(false);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  // Run the session check (streak survival, challenge refresh, Ghost Protocol)
  // once per login as soon as profile data is available, then every minute so
  // midnight rollovers are caught while the app stays open.
  useEffect(() => {
    if (!user || !hydrated) {
      sessionChecked.current = false;
      return;
    }
    if (!sessionChecked.current) {
      sessionChecked.current = true;
      void useStore.getState().runSessionCheck();
    }
    const interval = setInterval(() => {
      void useStore.getState().flushPending();
    }, PENDING_FLUSH_INTERVAL_MS);
    const dayWatch = setInterval(() => {
      const state = useStore.getState();
      if (state.profile && state.profile.challenges.dateKey !== todayKey()) {
        void state.runSessionCheck();
      }
    }, SESSION_CHECK_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      clearInterval(dayWatch);
    };
  }, [user, hydrated]);

  // On backgrounding, record the heartbeat so Ghost Protocol measures the gap;
  // on foregrounding, run the session check to deliver the idle debrief.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (status: AppStateStatus) => {
      const state = useStore.getState();
      if (!state.user || !state.profile) return;
      if (status === 'background' || status === 'inactive') {
        void state.recordHeartbeat();
      } else if (status === 'active') {
        void state.runSessionCheck();
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style="light" />
        <RootNavigator />
        <LevelUpOverlay />
        <IdleMissionResultsModal />
        <GlitchOverlay />
        <ToastHost />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
