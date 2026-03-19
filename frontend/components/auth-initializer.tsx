'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      initialize();
    }
  }, [initialize]);

  return <>{children}</>;
}
