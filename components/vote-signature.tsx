"use client";

import { useState } from "react";
import { useWallet } from "@/context/wallet-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface VoteSignatureProps {
  proposalId: number;
  vote: string;
  onSignComplete: (signature: string) => void;
}

export function VoteSignature({
  proposalId,
  vote,
  onSignComplete,
}: VoteSignatureProps) {
  const { signMessage } = useWallet();
  const [status, setStatus] = useState<
    "idle" | "signing" | "success" | "error"
  >("idle");
  const [signature, setSignature] = useState<string | null>(null);

  const handleSign = async () => {
    setStatus("signing");

    try {
      // Kreiranje poruke za potpisivanje
      const message = JSON.stringify({
        action: "vote",
        proposalId,
        vote,
        timestamp: new Date().toISOString(),
      });

      // Potpisivanje poruke
      const sig = await signMessage(message);

      if (sig) {
        setSignature(sig);
        setStatus("success");
        onSignComplete(sig);
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("Error signing vote:", error);
      setStatus("error");
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        {status === "idle" && (
          <div className="text-center">
            <p className="mb-4 text-sm">
              Da biste potvrdili vaš glas, potrebno je da ga potpišete sa vašim
              novčanikom.
            </p>
            <Button onClick={handleSign}>Potpiši glas</Button>
          </div>
        )}

        {status === "signing" && (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Potpisivanje u toku...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Potvrdite zahtev za potpisivanje u vašem novčaniku.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-600">
              Glas uspešno potpisan!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vaš glas je zabeležen i verifikovan na blockchain-u.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-600">
              Greška prilikom potpisivanja
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Molimo pokušajte ponovo ili koristite drugi novčanik.
            </p>
            <Button variant="outline" className="mt-2" onClick={handleSign}>
              Pokušaj ponovo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
