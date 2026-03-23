'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Shield, 
  Clock, 
  User, 
  Bell, 
  AlertCircle,
  Menu,
  X,
  FileText,
  LogOut,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/records', label: 'Records', icon: FileText },
  { href: '/access', label: 'Access', icon: Shield },
  { href: '/notifications', label: 'Alerts', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
];

const allNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/records', label: 'Records', icon: FileText },
  { href: '/access', label: 'Access', icon: Shield },
  { href: '/logs', label: 'Logs', icon: Clock },
  { href: '/notifications', label: 'Alerts', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/emergency', label: 'Emergency', icon: AlertCircle },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { patient, logout, isAuthInitializing, authError, clearAuthError } = useAuth();

  useEffect(() => {
    if (authError) {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      const timer = setTimeout(() => {
        logout();
        router.push('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [authError, logout, router]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setHideBottomNav(true);
      } else {
        setHideBottomNav(false);
      }
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  if (isAuthInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-500 text-sm mb-4">{authError}</p>
          <p className="text-xs text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={isMobile ? 'p-4' : 'px-3'}>
      {/* Patient info card — mobile drawer only */}
      {isMobile && patient && (
        <div className="bg-emerald-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500">Logged in as</p>
          <p className="font-semibold text-gray-800 truncate mt-0.5">{patient?.name}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{patient?.patientId}</p>
        </div>
      )}

      {allNavItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => isMobile && setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
              isActive 
                ? 'bg-emerald-500 text-white font-semibold shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{item.label}</span>
          </Link>
        );
      })}
      
      {isMobile && (
        <div className="pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={() => { logout(); setSidebarOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 w-full hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Mobile Header ────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/ML.png" alt="MedLinkID" width={32} height={32} className="w-8 h-8" />
            <span className="font-bold text-gray-800">MedLinkID</span>
          </Link>
          
          <Link href="/notifications" className="p-2 rounded-xl hover:bg-gray-100 transition-colors relative" aria-label="Notifications">
            <Bell className="w-5 h-5 text-gray-700" />
          </Link>
        </div>
      </header>

      {/* ── Desktop Sidebar ──────────────────────────────────── */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-100">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-100">
            <Image src="/ML.png" alt="MedLinkID" width={36} height={36} className="w-9 h-9" />
            <span className="text-lg font-bold text-gray-900">MedLinkID</span>
          </div>
          
          {/* Patient Info Card */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Logged in as</p>
              <p className="font-semibold text-gray-800 truncate mt-0.5">{patient?.name}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{patient?.patientId}</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-3">
            <NavContent />
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 w-full hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Sidebar Overlay ───────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Image src="/ML.png" alt="MedLinkID" width={32} height={32} className="w-8 h-8" />
                  <span className="font-bold text-gray-800">MedLinkID</span>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="overflow-y-auto h-full pb-20">
                <NavContent isMobile />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="lg:pl-64">
        <div className="max-w-4xl mx-auto px-4 py-6 pt-20 pb-24 lg:px-6 lg:py-8 lg:pt-8 lg:pb-8">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ────────────────────────────────── */}
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 transition-transform duration-300 ${
          hideBottomNav ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="flex justify-around h-14 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-600' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
