'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/': 'MedLinkID - Digital Medical Records',
  '/login': 'Login - MedLinkID',
  '/dashboard': 'Dashboard - MedLinkID',
  '/records': 'Medical Records - MedLinkID',
  '/access': 'Access Control - MedLinkID',
  '/logs': 'Access Logs - MedLinkID',
  '/notifications': 'Notifications - MedLinkID',
  '/profile': 'Profile - MedLinkID',
  '/emergency': 'Emergency Card - MedLinkID',
  '/consent': 'Consent Requests - MedLinkID',
};

export function TitleUpdater() {
  const pathname = usePathname();

  useEffect(() => {
    const title = pageTitles[pathname] || 'MedLinkID';
    document.title = title;
  }, [pathname]);

  return null;
}
