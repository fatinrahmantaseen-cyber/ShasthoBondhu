import type { Metadata } from 'next';
import './globals.css';

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
      className="h-full scroll-smooth antialiased"
    >
      <body
        className="min-h-full flex flex-col bg-white text-slate-900 font-sans"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
