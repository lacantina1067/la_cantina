import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { create } from "zustand";
import { Product } from "../../domain/entities/Product";

const memoryStore = new Map<string, string>();
const STORAGE_KEY = "favorites-storage";

const memoryStorage = {
  getItem: (key: string) => memoryStore.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memoryStore.set(key, value);
  },
  removeItem: (key: string) => {
    memoryStore.delete(key);
  },
};

const getSafePersistStorage = () => {
  const localStorageRef = (globalThis as any)?.localStorage;
  if (localStorageRef) {
    try {
      const testKey = "__cantiapp_favorites_test__";
      localStorageRef.setItem(testKey, "ok");
      localStorageRef.removeItem(testKey);
      return localStorageRef;
    } catch {
      // Ignore and fallback
    }
  }

  if (AsyncStorage && typeof AsyncStorage.getItem === "function") {
    return AsyncStorage;
  }

  return memoryStorage;
};

const persistFavorites = async (favorites: Product[]) => {
  const serializedFavorites = JSON.stringify(favorites);

  if (Platform.OS === "web") {
    const storage = getSafePersistStorage();
    storage.setItem(STORAGE_KEY, serializedFavorites);
    return;
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEY, serializedFavorites);
  } catch {
    const storage = getSafePersistStorage();
    storage.setItem(STORAGE_KEY, serializedFavorites);
  }
};

const loadFavorites = async () => {
  try {
    if (Platform.OS === "web") {
      const storage =
        typeof window !== "undefined" ? getSafePersistStorage() : memoryStorage;
      const rawFavorites = storage.getItem(STORAGE_KEY);
      return rawFavorites ? (JSON.parse(rawFavorites) as Product[]) : [];
    }

    const rawFavorites = await AsyncStorage.getItem(STORAGE_KEY);
    return rawFavorites ? (JSON.parse(rawFavorites) as Product[]) : [];
  } catch {
    return [];
  }
};

interface FavoritesStore {
  favorites: Product[];
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => void;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],

  addFavorite: (product: Product) => {
    const favorites = get().favorites;
    if (!favorites.find((p) => p.id === product.id)) {
      const nextFavorites = [...favorites, product];
      set({ favorites: nextFavorites });
      void persistFavorites(nextFavorites);
    }
  },

  removeFavorite: (productId: string) => {
    const nextFavorites = get().favorites.filter((p) => p.id !== productId);
    set({ favorites: nextFavorites });
    void persistFavorites(nextFavorites);
  },

  isFavorite: (productId: string) => {
    return !!get().favorites.find((p) => p.id === productId);
  },

  toggleFavorite: (product: Product) => {
    const isFav = get().isFavorite(product.id);
    if (isFav) {
      get().removeFavorite(product.id);
      return;
    }

    get().addFavorite(product);
  },
}));

void (async () => {
  const favorites = await loadFavorites();
  useFavoritesStore.setState({ favorites });
})();
