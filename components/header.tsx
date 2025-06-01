"use client";
import { LogIn, LogOut, Wallet } from "lucide-react";
import Link from "next/link";
import { WalletInfo } from "./wallet-info";
import { useWallet } from "@/context/wallet-context";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, disconnect } = useWallet();
  const router = useRouter();
  return (
    <header className="border-b w-full">
      <div className="w-full max-w-full flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-semibold">
          <Wallet className="h-6 w-6" />
          <span>еВСД</span>
          <WalletInfo />
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {user ? (
            <>
              <div className="flex justify-center items-center space-x-6 w-full">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-center"
                >
                  Контролна табла
                </Link>
                <Link
                  href="/rezultati"
                  className="text-sm font-medium text-center"
                >
                  Јавни резултати
                </Link>
              </div>
              <Button
                variant="link"
                size="sm"
                className="text-sm font-medium text-blue-500"
                onClick={() => {
                  disconnect();
                  router.push("/");
                }}
              >
                <LogOut className="h-4 w-4 inline mr-1" />
                Одјави се
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-blue-500">
                <LogIn className="h-4 w-4 inline mr-1" />
                Пријави се
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
