/** In-memory stand-in for firebase/app used by Jest (see moduleNameMapper). */

export interface FirebaseApp {
  name: string;
}

const apps: FirebaseApp[] = [];

export function initializeApp(_config: Record<string, unknown>): FirebaseApp {
  const app = { name: `mock-app-${apps.length}` };
  apps.push(app);
  return app;
}

export function getApps(): FirebaseApp[] {
  return apps;
}

export function getApp(): FirebaseApp {
  const app = apps[0];
  if (!app) throw new Error('No Firebase app initialized');
  return app;
}
