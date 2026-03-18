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
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/ML.png" alt="MedLinkID" width={40} height={40} className="w-10 h-10" />
            <span className="text-xl font-bold text-text-primary">MedLinkID</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outlined" className="hidden sm:flex">
                Login
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="filled">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Heart className="w-4 h-4" />
                Your Health, Your Control
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-text-primary leading-tight mb-6">
                Your Digital
                <span className="text-primary"> Medical Identity</span>
              </h1>
              <p className="text-lg lg:text-xl text-text-secondary mb-8 leading-relaxed">
                Access your medical records anywhere, anytime. Share with hospitals securely 
                with just a QR code. Complete control over who sees your health data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button className="w-full sm:w-auto">
                    Login to Portal
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8 lg:p-12">
                <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">MedLinkID</p>
                        <p className="text-sm text-text-secondary">Patient Portal</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Secure
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-surface-low rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="text-text-primary">Medical Records</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-surface-low rounded-lg">
                      <AlertCircle className="w-5 h-5 text-primary" />
                      <span className="text-text-primary">Emergency Card</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-surface-low rounded-lg">
                      <Building2 className="w-5 h-5 text-primary" />
                      <span className="text-text-primary">Hospital Access</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-surface-low rounded-lg">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="text-text-primary">Access Logs</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-8 lg:p-12 text-center text-white"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Login to access your medical records, manage hospital access, and share your health information securely.
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-white text-black hover:bg-white/90">
                Login to Patient Portal
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-low py-12 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
            <Image src="/ML.png" alt="MedLinkID" width={40} height={40} className="w-10 h-10" />
                <span className="text-xl font-bold text-text-primary">MedLinkID</span>
              </div>
              <p className="text-text-secondary text-sm">
                Your trusted digital medical record platform. Secure, convenient, and comprehensive.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><Link href="/login" className="hover:text-primary">Login</Link></li>
                <li><a href="#" className="hover:text-primary">Register</a></li>
                <li><a href="#" className="hover:text-primary">About Us</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-primary">Medical Records</a></li>
                <li><a href="#" className="hover:text-primary">Emergency Card</a></li>
                <li><a href="#" className="hover:text-primary">Hospital Access</a></li>
                <li><a href="#" className="hover:text-primary">Access Logs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>support@medlinkid.com</li>
                <li>+91 1800 123 4567</li>
                <li>Chennai, Tamil Nadu</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-outline-variant pt-8 text-center text-sm text-text-secondary">
            <p>&copy; 2024 MedLinkID. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
