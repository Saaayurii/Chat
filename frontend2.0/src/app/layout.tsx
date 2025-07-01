import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Theme } from "@radix-ui/themes";
import AppLayout from "@/components/Layout/AppLayout";
import "@radix-ui/themes/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Система чата",
  description: "Система чата для поддержки клиентов",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: '/apple-touch-icon.png',
  },
  keywords: ['чат', 'поддержка', 'клиенты', 'оператор', 'система'],
  authors: [{ name: 'Система чата' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Theme>
          <Providers>
            <AppLayout>
              {children}
            </AppLayout>
          </Providers>
        </Theme>
      </body>
    </html>
  );
}
