import { renderHook, act } from "@testing-library/react";
import useDebounce from "@/hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });

  test("delays updating the value until the specified delay has passed", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 500 },
    });

    // Initial value
    expect(result.current).toBe("initial");

    // Update the value
    rerender({ value: "updated", delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe("initial");

    // Fast-forward time by 250ms (half the delay)
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Value should still be the initial value
    expect(result.current).toBe("initial");

    // Fast-forward time to complete the delay
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Now the value should be updated
    expect(result.current).toBe("updated");
  });

  test("resets the timer when the value changes during the delay period", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 500 },
    });

    // Update the value
    rerender({ value: "intermediate", delay: 500 });

    // Fast-forward time by 250ms (half the delay)
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Value should still be the initial value
    expect(result.current).toBe("initial");

    // Update the value again before the delay completes
    rerender({ value: "final", delay: 500 });

    // Fast-forward time by another 250ms (completes the first delay, but not the second)
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Value should still be the initial value since we reset the timer
    expect(result.current).toBe("initial");

    // Fast-forward time to complete the second delay
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Now the value should be updated to the final value
    expect(result.current).toBe("final");
  });

  test("uses the default delay of 500ms when no delay is specified", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "initial" },
    });

    // Update the value
    rerender({ value: "updated" });

    // Value should not change immediately
    expect(result.current).toBe("initial");

    // Fast-forward time by 499ms (just before the default delay)
    act(() => {
      jest.advanceTimersByTime(499);
    });

    // Value should still be the initial value
    expect(result.current).toBe("initial");

    // Fast-forward time by 1ms to complete the delay
    act(() => {
      jest.advanceTimersByTime(1);
    });

    // Now the value should be updated
    expect(result.current).toBe("updated");
  });
});
