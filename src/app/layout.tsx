import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://prospekto.id'),
  title: {
    default: "Prospekto CRM - Platform Ekstraksi Data Prospek B2B & B2C",
    template: "%s | Prospekto CRM",
  },
  description: "Prospekto CRM - Ekstrak data prospek bisnis lokal (B2B & B2C) dari Google Maps dan optimasi outreach secara efisien. Kembangkan bisnis Anda dengan data prospek berkualitas.",
  keywords: ["CRM", "Ekstraksi Data", "Prospek B2B", "Prospek B2C", "Google Maps Scraper", "Data Bisnis Lokal", "Outreach", "Prospekto", "Lead Generation"],
  authors: [{ name: "Prospekto" }],
  creator: "Prospekto",
  publisher: "Prospekto",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Prospekto CRM - Platform Ekstraksi Data Prospek",
    description: "Ekstrak data prospek bisnis lokal dan otomatisasi outreach secara efisien.",
    url: "https://prospekto.id",
    siteName: "Prospekto CRM",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prospekto CRM",
    description: "Platform Ekstraksi Data Prospek B2B & B2C Terbaik.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" }
    ],
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="only light" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                    document.documentElement.style.colorScheme = 'only light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster position="top-center" />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
