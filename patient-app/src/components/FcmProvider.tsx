'use client';

import { useFcmToken } from '@/hooks/useFcmToken';

export function FcmProvider({ children }: { children: React.ReactNode }) {
  useFcmToken();
  return <>{children}</>;
}