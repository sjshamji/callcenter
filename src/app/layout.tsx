import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Navigation } from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Angata Sugar Mills Call Center",
  description: "AI-powered call center for sugarcane farmers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-950 dark:to-amber-950 min-h-screen">
        <div
          className="fixed inset-0 bg-repeat opacity-5 pointer-events-none"
          style={{
            backgroundImage: "url('/sugarcane-pattern.svg')",
            backgroundSize: "300px",
          }}
        ></div>
        <Navigation />
        <main className="relative">{children}</main>
      </body>
    </html>
  );
}
