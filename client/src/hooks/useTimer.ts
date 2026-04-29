import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Gestiona un temporitzador de compte enrere sincronitzat amb el servidor.
 *
 * Comportament:
 * - `start(seconds)` inicia un interval local d'1 segon.
 * - `syncWithServer(remaining)` corregeix el temps local si difereix en > 1s
 *   del valor rebut via game:timer-tick.
 * - `stop()` atura l'interval.
 * - Quan el temps arriba a 0, crida `onExpire` una sola vegada i s'atura.
 *
 * @param onExpire  Callback cridat quan el timer expira (temps = 0)
 */
export function useTimer(onExpire: () => void): {
  timeRemaining: number;
  isRunning: boolean;
  start: (seconds: number) => void;
  stop: () => void;
  syncWithServer: (remaining: number) => void;
} {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback(
    (seconds: number) => {
      stop();
      setTimeRemaining(seconds);
      setIsRunning(seconds > 0);
      if (seconds <= 0) {
        onExpireRef.current();
        return;
      }

      intervalRef.current = setInterval(() => {
        setTimeRemaining((previous) => {
          if (previous <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsRunning(false);
            onExpireRef.current();
            return 0;
          }
          return previous - 1;
        });
      }, 1000);
    },
    [stop]
  );

  const syncWithServer = useCallback((remaining: number) => {
    setTimeRemaining((previous) =>
      Math.abs(previous - remaining) > 1 ? remaining : previous
    );
    setIsRunning(remaining > 0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { timeRemaining, isRunning, start, stop, syncWithServer };
}
