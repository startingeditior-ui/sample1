'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Shield, 
  FileText, 
  ArrowRight, 
  Heart,
  Building2,
  AlertCircle,
  Clock,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

const features = [
  { icon: FileText, label: 'Medical Records', desc: 'All your records in one place' },
  { icon: AlertCircle, label: 'Emergency Card', desc: 'Instant access for first responders' },
  { icon: Building2, label: 'Hospital Access', desc: 'Secure QR-based sharing' },
  { icon: Clock, label: 'Access Logs', desc: 'Full audit trail' },
];

export default function LandingPage() {
  const router = useRouter();
  const { patient, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && patient) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, patient, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Frosted Header ─────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/ML.png" alt="MedLinkID" width={40} height={40} className="w-9 h-9" />
            <span className="text-xl font-bold text-gray-900">MedLinkID</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:flex text-gray-600">
                Login
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="filled">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-emerald-100">
                <Heart className="w-4 h-4" />
                Your Health, Your Control
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Your Digital{' '}
                <span className="text-emerald-600">Medical Identity</span>
              </h1>

              <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-md">
                Access your medical records anywhere, anytime. Share with hospitals securely 
                with just a QR code. Complete control over who sees your health data.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto">
                    Login to Portal
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right — Mock Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 rounded-3xl p-8 lg:p-10">
                <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
                  {/* Card header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">MedLinkID</p>
                        <p className="text-xs text-gray-500">Patient Portal</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Secure
                    </span>
                  </div>

                  {/* Feature list */}
                  <div className="space-y-3">
                    {features.map((f, i) => {
                      const Icon = f.icon;
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800">{f.label}</p>
                            <p className="text-xs text-gray-500">{f.desc}</p>
                          </div>
                          <Check className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA Band ───────────────────────────────────────────── */}
      <section className="py-16 lg:py-24 px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-3xl p-8 lg:p-14 text-center text-white"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base lg:text-lg text-white/80 mb-8 max-w-xl mx-auto leading-relaxed">
              Login to access your medical records, manage hospital access, and share your health information securely.
            </p>
            <Link href="/login">
              <button className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-7 py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm">
                Login to Patient Portal
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image src="/ML.png" alt="MedLinkID" width={32} height={32} className="w-8 h-8" />
                <span className="text-base font-bold text-gray-900">MedLinkID</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Your trusted digital medical record platform. Secure, convenient, and comprehensive.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-4 text-sm">Quick Links</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link href="/login" className="hover:text-emerald-600 transition-colors">Login</Link></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Register</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-4 text-sm">Services</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Medical Records</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Emergency Card</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Hospital Access</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Access Logs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-4 text-sm">Contact</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li>support@medlinkid.com</li>
                <li>+91 1800 123 4567</li>
                <li>Chennai, Tamil Nadu</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
            <p>&copy; 2024 MedLinkID. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
