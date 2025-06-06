"use client";
import { LogIn, LogOut, Menu, Wallet, X } from "lucide-react";
import Link from "next/link";
import { WalletInfo } from "./wallet-info";
import { useWallet } from "@/context/wallet-context";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  showNav?: boolean;
}

export function Header({ showNav = true }: HeaderProps) {
  const { user, disconnect } = useWallet();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b w-full">
      <div className="w-full max-w-full flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Wallet className="h-6 w-6" />
          <span>еВСД</span>
          <WalletInfo />
        </Link>
        {showNav && (
          <div className="ml-auto flex gap-4 sm:gap-6">
            {user ? (
              <>
                <nav>
                  <div className="hidden sm:flex justify-center items-center space-x-6 w-full">
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
                    <Button
                      variant="link"
                      size="sm"
                      className="text-sm font-medium text-red-500"
                      onClick={() => {
                        disconnect();
                        router.push("/");
                      }}
                    >
                      <LogOut className="h-4 w-4 inline mr-1" />
                      Одјави се
                    </Button>
                  </div>
                </nav>

                <div className="sm:hidden">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="relative z-50"
                  >
                    {isMobileMenuOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </Button>

                  {isMobileMenuOpen && (
                    <div
                      className="fixed inset-0 bg-black/50 z-40"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className="absolute top-16 right-4 bg-background rounded-md shadow-lg z-50 w-48 py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm hover:bg-accent"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Контролна табла
                        </Link>
                        <Link
                          href="/rezultati"
                          className="block px-4 py-2 text-sm hover:bg-accent"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Јавни резултати
                        </Link>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-accent flex items-center"
                          onClick={() => {
                            disconnect();
                            router.push("/");
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Одјави се
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-blue-500"
                >
                  <LogIn className="h-4 w-4 inline mr-1" />
                  Пријави се
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
