import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const memoryStore = new Map<string, string>();

const getSafeLocalStorage = () => {
  const maybeLocalStorage = (globalThis as any)?.localStorage;
  if (!maybeLocalStorage) return null;

  try {
    const testKey = "__cantiapp_storage_test__";
    maybeLocalStorage.setItem(testKey, "ok");
    maybeLocalStorage.removeItem(testKey);
    return maybeLocalStorage;
  } catch {
    return null;
  }
};

const memoryStorage = {
  async getItem(key: string) {
    return memoryStore.get(key) ?? null;
  },
  async setItem(key: string, value: string) {
    memoryStore.set(key, value);
  },
  async removeItem(key: string) {
    memoryStore.delete(key);
  },
};

const localStorageRef = getSafeLocalStorage();

const authStorage = localStorageRef
  ? {
      async getItem(key: string) {
        return localStorageRef.getItem(key);
      },
      async setItem(key: string, value: string) {
        localStorageRef.setItem(key, value);
      },
      async removeItem(key: string) {
        localStorageRef.removeItem(key);
      },
    }
  : memoryStorage;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
