import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { SocketProvider } from "@/hooks/useSocket";
import { AppLayout } from "@/components/layout/AppLayout";
import { TitleUpdater } from "@/components/TitleUpdater";
import { FcmProvider } from "@/components/FcmProvider";
import { ToastProvider } from "@/components/ToastProvider";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MedLinkID - Patient Portal",
  description: "Digital Medical Record Exchange Platform",
  icons: {
    icon: "/ML.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/ML.png" type="image/png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <TitleUpdater />
        <SocketProvider>
          <ToastProvider>
            <AuthProvider>
              <FcmProvider>
                <AppLayout>
                  {children}
                </AppLayout>
              </FcmProvider>
            </AuthProvider>
          </ToastProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
