'use client';

import { useEffect } from 'react';

export function useDevServerHeartbeat() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Simple heartbeat without react-idle-timer to avoid SSR issues
    const interval = setInterval(() => {
      fetch('/', {
        method: 'GET',
      }).catch((error) => {
        // this is a no-op, we just want to keep the dev server alive
      });
    }, 60_000 * 3); // 3 minutes

    return () => clearInterval(interval);
  }, []);
}
