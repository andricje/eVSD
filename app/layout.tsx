import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/wallet-context";
import { Toaster } from "@/components/ui/toaster";
import { ProposalsProvider } from "@/context/proposals-context";
import { config } from "@/evsd.config";
import { UserServiceProvider } from "@/context/user-context";
// import { AnnouncementsProvider } from "@/context/announcements-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "eVSD - Elektronski sistem za sednice i glasanje",
  description:
    "Elektronski sistem za sednice i glasanje Velikog studentskog doma",
  generator: "Marko Andric",
};

function getProposalServiceType() {
  return config.proposalService.type;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const type = getProposalServiceType();
  return (
    <html lang="sr">
      <body className={inter.className}>
        <WalletProvider type={type}>
          <UserServiceProvider type={type}>
            <ProposalsProvider type={type}>{children}</ProposalsProvider>
          </UserServiceProvider>
        </WalletProvider>
        <Toaster />
      </body>
    </html>
  );
}
