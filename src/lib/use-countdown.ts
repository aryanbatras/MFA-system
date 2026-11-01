"use client";

import * as React from "react";

export function useCountdown(initialSeconds = 30) {
  const [seconds, setSeconds] = React.useState(0);

  React.useEffect(() => {
    if (seconds <= 0) return;

    const timer = window.setInterval(() => {
      setSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [seconds]);

  const start = React.useCallback(
    (value = initialSeconds) => setSeconds(value),
    [initialSeconds],
  );

  return { seconds, start };
}
