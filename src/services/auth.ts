import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../../firebase.config';
import type { CharacterAppearance } from '../types';
import { buildInitialProfile } from '../utils/profile';
import { writeProfile } from './firestore';

/** Translate Firebase auth error codes into in-world, user-facing messages. */
export function mapAuthError(err: unknown): string {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That handle isn’t a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been flatlined by an administrator.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Credentials rejected. Check your email and passcode.';
    case 'auth/email-already-in-use':
      return 'A runner is already registered under that email.';
    case 'auth/weak-password':
      return 'Passcode too weak — 6 characters minimum.';
    case 'auth/too-many-requests':
      return 'ICE detected too many attempts. Cool down and retry.';
    case 'auth/network-request-failed':
      return 'Uplink severed. Check your connection and retry.';
    default:
      return 'Unknown grid fault. Try again.';
  }
}

export interface SignUpInput {
  email: string;
  password: string;
  characterName: string;
  appearance: CharacterAppearance;
}

export async function signUpUser(input: SignUpInput): Promise<string> {
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  const uid = cred.user.uid;
  const profile = buildInitialProfile(input.email.trim(), input.characterName.trim(), input.appearance);
  await writeProfile(uid, profile);
  return uid;
}

export async function logInUser(email: string, password: string): Promise<string> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user.uid;
}

export async function logOutUser(): Promise<void> {
  await signOut(auth);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}
