/** In-memory stand-in for firebase/auth used by Jest (see moduleNameMapper). */

export interface MockUser {
  uid: string;
  email: string;
}

interface StoredAccount {
  uid: string;
  password: string;
}

let accounts = new Map<string, StoredAccount>();
let currentUser: MockUser | null = null;
let callbacks: ((user: MockUser | null) => void)[] = [];
let uidCounter = 0;

function emit(): void {
  for (const cb of callbacks) cb(currentUser);
}

export function __resetAuth(): void {
  accounts = new Map();
  currentUser = null;
  callbacks = [];
  uidCounter = 0;
}

export function __currentUser(): MockUser | null {
  return currentUser;
}

export function getAuth(_app?: unknown): Record<string, never> {
  return {};
}

export function initializeAuth(_app: unknown, _options?: unknown): Record<string, never> {
  return {};
}

export function getReactNativePersistence(_storage: unknown): Record<string, never> {
  return {};
}

export async function createUserWithEmailAndPassword(
  _auth: unknown,
  email: string,
  password: string,
): Promise<{ user: MockUser }> {
  if (accounts.has(email)) {
    throw Object.assign(new Error('email in use'), { code: 'auth/email-already-in-use' });
  }
  if (password.length < 6) {
    throw Object.assign(new Error('weak password'), { code: 'auth/weak-password' });
  }
  uidCounter += 1;
  const uid = `mock-uid-${uidCounter}`;
  accounts.set(email, { uid, password });
  currentUser = { uid, email };
  emit();
  return { user: currentUser };
}

export async function signInWithEmailAndPassword(
  _auth: unknown,
  email: string,
  password: string,
): Promise<{ user: MockUser }> {
  const account = accounts.get(email);
  if (!account || account.password !== password) {
    throw Object.assign(new Error('bad credentials'), { code: 'auth/invalid-credential' });
  }
  currentUser = { uid: account.uid, email };
  emit();
  return { user: currentUser };
}

export async function signOut(_auth: unknown): Promise<void> {
  currentUser = null;
  emit();
}

export async function sendPasswordResetEmail(_auth: unknown, email: string): Promise<void> {
  if (!accounts.has(email)) {
    throw Object.assign(new Error('no user'), { code: 'auth/user-not-found' });
  }
}

export function onAuthStateChanged(_auth: unknown, cb: (user: MockUser | null) => void): () => void {
  callbacks.push(cb);
  cb(currentUser);
  return () => {
    callbacks = callbacks.filter((c) => c !== cb);
  };
}
