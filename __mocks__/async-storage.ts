/** In-memory AsyncStorage for Jest (see moduleNameMapper). */

let storage = new Map<string, string>();

const AsyncStorageMock = {
  async getItem(key: string): Promise<string | null> {
    return storage.has(key) ? (storage.get(key) as string) : null;
  },
  async setItem(key: string, value: string): Promise<void> {
    storage.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    storage.delete(key);
  },
  async multiRemove(keys: string[]): Promise<void> {
    for (const key of keys) storage.delete(key);
  },
  async clear(): Promise<void> {
    storage = new Map();
  },
  __reset(): void {
    storage = new Map();
  },
};

export default AsyncStorageMock;
