// hooks/useDebounce.ts
import { useState, useEffect } from "react";

/**
 * Debounce any fast‑changing value.
 */
export default function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
