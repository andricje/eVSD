"use client";

import { useState, useEffect } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wallet, AlertTriangle, Loader2, Info, Laptop } from "lucide-react";
import { ethers } from "ethers";

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "checking" | "error" | "success"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [signerAddress, setSignerAddress] = useState<string>();
  const [provider, setProvider] = useState<ethers.BrowserProvider>();
  const [signer, setSigner] = useState<ethers.Signer>();
  const connectWallet = async () => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      setProvider(provider);
      setSigner(signer);
      setSignerAddress(await signer.getAddress());
    } else {
      setStatus("error");
      console.error("No Ethereum provider found");
    }
  };

  const checkWallet = () => {
    setStatus("checking");

    // Ako je demo režim, preskačemo sve provere
    if (isDemoMode) {
      // Simuliramo uspešnu prijavu bez provere novčanika
      setTimeout(() => {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 1000);
      }, 1500);
      return;
    }
  };

  return (
    <div className="w-full max-w-full flex items-center justify-center min-h-screen px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Wallet className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl text-center">
            Prijava na eVSD
          </CardTitle>
          <CardDescription className="text-center">
            {isDemoMode
              ? "Demo pristup sistemu"
              : "Povežite vaš kripto novčanik da biste pristupili sistemu"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDemoMode && status === "idle" && (
            <Alert className="bg-blue-50 text-blue-800 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertTitle>Demo režim je aktivan</AlertTitle>
              <AlertDescription>
                Preskočićemo proveru novčanika. Ovo je samo za demonstraciju.
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Greška</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {status === "success" && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertTitle>Uspešna autentifikacija</AlertTitle>
              <AlertDescription>
                {isDemoMode
                  ? "Demo pristup odobren"
                  : "Novčanik je verifikovan"}
                . Preusmeravamo vas...
              </AlertDescription>
            </Alert>
          )}

          {provider && signer && (
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <h3 className="font-medium mb-2">Povezani novčanik</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  <div>
                    {/* <div className="font-medium">{authorizedWallet.faculty}</div> */}
                    Test Fakultet
                    <div className="text-xs text-muted-foreground">
                      {/* {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)} */}
                      {signerAddress}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-blue-500" />
                  <div className="text-sm">Uređaj: Windows PC (Chrome)</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Demo režim</span>
              <button
                onClick={() => setIsDemoMode(!isDemoMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDemoMode ? "bg-green-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDemoMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Omogućite demo režim da biste preskočili sve provere (samo za
              demonstraciju)
            </p>
          </div>
        </CardContent>
        <CardFooter>
          {!provider || !signer ? (
            isDemoMode ? (
              <Button
                className="w-full"
                onClick={checkWallet}
                disabled={status === "checking" || status === "success"}
              >
                {status === "checking" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {status === "checking" ? "Provera..." : "Demo prijava"}
              </Button>
            ) : (
              <Button onClick={async () => await connectWallet()}>
                <Wallet className="h-4 w-4 mr-2" />
                Poveži novčanik
              </Button>
            )
          ) : (
            <Button
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Nastavi na dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
