import { useState, useEffect, useCallback } from "react";

const PREFIX = "icu-ts-";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw !== null) return JSON.parse(raw);
  } catch { /* ignore */ }
  return fallback;
}

export function usePersistedState<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => load(key, fallback));

  useEffect(() => {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }, [key, value]);

  // Listen for clear event
  useEffect(() => {
    const handler = () => setValue(fallback);
    window.addEventListener("icu-clear-patient", handler);
    return () => window.removeEventListener("icu-clear-patient", handler);
  }, [fallback]);

  return [value, setValue];
}

/** Call this to clear all persisted tab state */
export function clearAllPersistedState() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
  window.dispatchEvent(new Event("icu-clear-patient"));
}
