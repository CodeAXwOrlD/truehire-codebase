import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { BackgroundGrid } from "@/components/ui/BackgroundGrid";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { AuthProvider } from "@/lib/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  fallback: ["SFMono-Regular", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: "TrueHire — Real jobs, resolved",
  description: "Ghost-job risk scoring for candidates. Requisition risk signals for recruiters.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <AuthProvider>
          <BackgroundGrid />
          <CustomCursor />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
