"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { useWallet } from "@/context/wallet-context";
import { WalletAddress } from "@/components/wallet-address";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useWallet();

  return (
    <div className="w-full max-w-full flex items-center justify-center min-h-screen px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Wallet className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl text-center">
            Пријава на еВСД
          </CardTitle>
          <CardDescription className="text-center">
            Повежите Ваш дигитални новчаник да бисте приступили систему
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <h3 className="font-medium mb-2">Повезани новчаник</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  <div>
                    {user.name}
                    <WalletAddress
                      address={user.address}
                      className="text-xs text-muted-foreground"
                      iconSize={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!user ? (
            <div className="w-full flex flex-row gap-2">
              <Button
                onClick={() => router.push("/")}
                variant={"outline"}
                className="w-full"
              >
                Назад
              </Button>
              <WalletConnectButton />
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Настави на контролну таблу
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
