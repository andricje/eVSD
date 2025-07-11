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
import { AlertCircle, Wallet } from "lucide-react";

import { useWallet } from "@/context/wallet-context";
import { STRINGS } from "@/constants/strings";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { WalletAddress } from "@/components/wallet-address";
import { useUserService } from "@/hooks/use-userservice";

export default function LoginPage() {
  const router = useRouter();
  const { walletError } = useWallet();
  const { currentUser } = useUserService();

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
          {walletError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-red-600 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <h3 className="font-medium">
                  {STRINGS.newProposal.error.title}
                </h3>
                <p className="text-sm break-words whitespace-pre-wrap">
                  {walletError}
                </p>
              </div>
            </div>
          )}
          {currentUser && (
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <h3 className="font-medium mb-2">Повезани новчаник</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  <div>
                    {currentUser.name}
                    <WalletAddress
                      address={currentUser.address}
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
          {!currentUser ? (
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
