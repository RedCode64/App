import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ============================================================
 *  REPLACE THE VALUES BELOW WITH YOUR OWN FIREBASE PROJECT'S
 *  CONFIGURATION (Firebase console → Project settings → Your
 *  apps → SDK setup and configuration → Config).
 *
 *  The app will boot with these placeholders, but every auth
 *  and Firestore call will fail until real values are set.
 * ============================================================
 */
export const firebaseConfig = {
  apiKey: 'REPLACE_WITH_YOUR_API_KEY',
  authDomain: 'REPLACE_WITH_YOUR_PROJECT.firebaseapp.com',
  projectId: 'REPLACE_WITH_YOUR_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_YOUR_PROJECT.appspot.com',
  messagingSenderId: 'REPLACE_WITH_YOUR_SENDER_ID',
  appId: 'REPLACE_WITH_YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);

// AsyncStorage-backed persistence keeps the session alive across app restarts.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
