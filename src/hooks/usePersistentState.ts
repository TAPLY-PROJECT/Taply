import { useEffect, useState } from "react";

export const TAPLY_STORAGE_EVENT = "taply:storage-change";

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return initialValue;
    }

    try {
      return JSON.parse(stored) as T;
    } catch {
      window.localStorage.removeItem(key);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  useEffect(() => {
    const syncValue = (event: StorageEvent | Event) => {
      if (event.type === "storage" && (event as StorageEvent).key !== key) {
        return;
      }

      const stored = window.localStorage.getItem(key);
      if (!stored) {
        setValue(initialValue);
        return;
      }

      try {
        setValue(JSON.parse(stored) as T);
      } catch {
        setValue(initialValue);
      }
    };

    window.addEventListener("storage", syncValue);
    window.addEventListener(TAPLY_STORAGE_EVENT, syncValue);
    return () => {
      window.removeEventListener("storage", syncValue);
      window.removeEventListener(TAPLY_STORAGE_EVENT, syncValue);
    };
  }, [initialValue, key]);

  return { setValue, value };
}
