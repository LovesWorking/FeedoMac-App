// @src/storage/mmkvStorage.ts
import { createMMKV } from 'react-native-mmkv';

export const storage =  createMMKV({
  id: 'feedomac',
});

export const setItem = (key: string, value: string) => storage.set(key, value);
export const getItem = (key: string) => storage.getString(key) ?? null;
export const removeItem = (key: string) => storage.remove(key);
