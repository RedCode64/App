import type { Persistence } from 'firebase/auth';

/**
 * `getReactNativePersistence` is implemented by the react-native build of
 * firebase/auth (which Metro resolves at runtime via the package's
 * "react-native" field), but the published browser typings omit it. This
 * augmentation mirrors the signature from @firebase/auth/dist/rn/index.rn.d.ts.
 */
declare module 'firebase/auth' {
  interface ReactNativeAsyncStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }

  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
