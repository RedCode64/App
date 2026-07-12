/**
 * In-memory stand-in for firebase/firestore used by Jest (see
 * moduleNameMapper). Supports the subset the app uses: doc/collection refs,
 * setDoc (merge), getDoc, deleteDoc and onSnapshot with live notifications,
 * plus an offline toggle so sync/queue behavior can be exercised.
 */

export type Unsubscribe = () => void;

type DocData = Record<string, unknown>;

interface DocRef {
  __type: 'doc';
  __path: string;
}

interface CollectionRef {
  __type: 'collection';
  __path: string;
}

interface DocListener {
  kind: 'doc';
  path: string;
  cb: (snap: DocSnapshot) => void;
}

interface CollectionListener {
  kind: 'collection';
  path: string;
  cb: (snap: CollectionSnapshot) => void;
}

export interface DocSnapshot {
  id: string;
  exists: () => boolean;
  data: () => DocData | undefined;
}

export interface CollectionSnapshot {
  forEach: (fn: (snap: DocSnapshot) => void) => void;
  docs: DocSnapshot[];
}

let store = new Map<string, DocData>();
let listeners: (DocListener | CollectionListener)[] = [];
let offline = false;

export function __resetFirestore(): void {
  store = new Map();
  listeners = [];
  offline = false;
}

export function __setOffline(value: boolean): void {
  offline = value;
}

export function __getDoc(path: string): DocData | undefined {
  return store.get(path);
}

export function __docCount(prefix: string): number {
  let count = 0;
  for (const path of store.keys()) {
    if (path.startsWith(`${prefix}/`)) count += 1;
  }
  return count;
}

function docSnapshot(path: string): DocSnapshot {
  const data = store.get(path);
  const id = path.split('/').pop() ?? path;
  return {
    id,
    exists: () => data !== undefined,
    data: () => (data ? { ...data } : undefined),
  };
}

function collectionSnapshot(path: string): CollectionSnapshot {
  const docs: DocSnapshot[] = [];
  const prefixLen = path.length + 1;
  for (const key of store.keys()) {
    if (key.startsWith(`${path}/`) && !key.slice(prefixLen).includes('/')) {
      docs.push(docSnapshot(key));
    }
  }
  return {
    docs,
    forEach: (fn) => docs.forEach(fn),
  };
}

function notify(docPath: string): void {
  const parentPath = docPath.split('/').slice(0, -1).join('/');
  for (const listener of listeners) {
    if (listener.kind === 'doc' && listener.path === docPath) {
      listener.cb(docSnapshot(docPath));
    } else if (listener.kind === 'collection' && listener.path === parentPath) {
      listener.cb(collectionSnapshot(parentPath));
    }
  }
}

export function getFirestore(_app?: unknown): Record<string, never> {
  return {};
}

export function doc(_db: unknown, ...segments: string[]): DocRef {
  return { __type: 'doc', __path: segments.join('/') };
}

export function collection(_db: unknown, ...segments: string[]): CollectionRef {
  return { __type: 'collection', __path: segments.join('/') };
}

function isPlainObject(value: unknown): value is DocData {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(target: DocData, source: DocData): DocData {
  const out: DocData = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = out[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      out[key] = deepMerge(existing, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export async function setDoc(ref: DocRef, data: DocData, options?: { merge?: boolean }): Promise<void> {
  if (offline) throw new Error('firestore/unavailable (mock offline)');
  const existing = store.get(ref.__path);
  const next = options?.merge === true && existing ? deepMerge(existing, data) : { ...data };
  store.set(ref.__path, JSON.parse(JSON.stringify(next)) as DocData);
  notify(ref.__path);
}

export async function getDoc(ref: DocRef): Promise<DocSnapshot> {
  if (offline) throw new Error('firestore/unavailable (mock offline)');
  return docSnapshot(ref.__path);
}

export async function deleteDoc(ref: DocRef): Promise<void> {
  if (offline) throw new Error('firestore/unavailable (mock offline)');
  store.delete(ref.__path);
  notify(ref.__path);
}

export function onSnapshot(
  ref: DocRef | CollectionRef,
  cb: ((snap: DocSnapshot) => void) | ((snap: CollectionSnapshot) => void),
  _onError?: (err: Error) => void,
): Unsubscribe {
  if (ref.__type === 'doc') {
    const listener: DocListener = { kind: 'doc', path: ref.__path, cb: cb as (snap: DocSnapshot) => void };
    listeners.push(listener);
    listener.cb(docSnapshot(ref.__path));
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }
  const listener: CollectionListener = {
    kind: 'collection',
    path: ref.__path,
    cb: cb as (snap: CollectionSnapshot) => void,
  };
  listeners.push(listener);
  listener.cb(collectionSnapshot(ref.__path));
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
