import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value.
 * Useful for delaying updates until a certain amount of time has passed without change,
 * e.g., delaying API calls triggered by user input.
 *
 * @param value The value to debounce.
 * @param delay The debounce delay in milliseconds. Defaults to 500ms.
 * @returns The debounced value.
 */
function useDebounce<T>(value: T, delay: number = 500): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value or delay changes before the timer fires,
    // or if the component unmounts. This prevents unnecessary updates.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-run the effect if value or delay changes

  return debouncedValue;
}

export default useDebounce; 