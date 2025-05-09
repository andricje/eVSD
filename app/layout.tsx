import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/wallet-context";
import { Toaster } from "@/components/ui/toaster";
import { ProposalsProvider } from "@/hooks/proposals-context";
import { AnnouncementsProvider } from "@/context/announcements-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "eVSD - Elektronski sistem za sednice i glasanje",
  description:
    "Elektronski sistem za sednice i glasanje Velikog studentskog doma",
  generator: "Marko Andric",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <body className={inter.className}>
        <WalletProvider>
          <ProposalsProvider>
            <AnnouncementsProvider>
              {children}
            </AnnouncementsProvider>
          </ProposalsProvider>
        </WalletProvider>
        <Toaster />
      </body>
    </html>
  );
}
