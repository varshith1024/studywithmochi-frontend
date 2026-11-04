import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import RotateGuard from "@/components/RotateGuard";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "StudyWithMochi – Study a little. Grow with Mochi.",
  description: "Build your study habit, earn Focus Energy, and grow a beautiful world together with Mochi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="antialiased">{children}<RotateGuard /></body>
    </html>
  );
}
