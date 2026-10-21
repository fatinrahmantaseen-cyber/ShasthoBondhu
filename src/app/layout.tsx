import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ShasthoBondhu (স্বাস্থ্যবন্ধু) | Find Care. Donate Blood. Save Lives.',
  description:
    'A modern, trustworthy healthcare assistance platform for Bangladesh. Find hospitals, specialist doctors, pharmacies, voluntary blood donors, and reliable dengue resources.',
  keywords: [
    'ShasthoBondhu',
    'স্বাস্থ্যবন্ধু',
    'Bangladesh Healthcare',
    'Blood Donation BD',
    'Doctors Bangladesh',
    'Hospitals Dhaka',
    'Dengue Information Bangladesh',
    'Pharmacies Bangladesh',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
