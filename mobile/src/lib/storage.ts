import { Platform } from "react-native";

let SecureStore: typeof import("expo-secure-store") | null = null;

if (Platform.OS !== "web") {
  SecureStore = require("expo-secure-store");
}

export async function getItem(key: string): Promise<string | null> {
  if (SecureStore) {
    return SecureStore.getItemAsync(key);
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (SecureStore) {
    return SecureStore.setItemAsync(key, value);
  }
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export async function deleteItem(key: string): Promise<void> {
  if (SecureStore) {
    return SecureStore.deleteItemAsync(key);
  }
  try {
    localStorage.removeItem(key);
  } catch {}
}
