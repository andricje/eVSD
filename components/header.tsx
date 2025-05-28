import { LogOut, Wallet } from "lucide-react";
import Link from "next/link";
import { WalletInfo } from "./wallet-info";

export function Header() {
  return (
    <header className="border-b w-full">
      <div className="w-full max-w-full flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-semibold">
          <Wallet className="h-6 w-6" />
          <span>еВСД</span>
          <WalletInfo />
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/dashboard" className="text-sm font-medium">
            Контролна табла
          </Link>
          <Link href="/rezultati" className="text-sm font-medium">
            Јавни резултати
          </Link>
          <Link href="/login" className="text-sm font-medium text-blue-500">
            <LogOut className="h-4 w-4 inline mr-1" />
            Пријава
          </Link>
        </nav>
      </div>
    </header>
  );
}
