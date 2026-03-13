import type { Metadata } from "next";
import { Black_Ops_One } from "next/font/google";
import "./globals.css";

const blackOpsOne = Black_Ops_One({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-black-ops"
});

export const metadata: Metadata = {
  title: "Digital Wasteland Demo",
  description: "OpenClaw Agent World Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className={`${blackOpsOne.className} bg-zinc-950 text-zinc-100 overflow-x-hidden`}>
        <div className="scanline" />
        <div className="crt-overlay" />
        <main className="relative z-10 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
