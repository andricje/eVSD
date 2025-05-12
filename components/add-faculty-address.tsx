import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { registerNewVoter, hasVotingRights, getDeployedContracts } from "@/lib/blockchain-utils";
import { updateAddressNameMap } from "@/lib/address-name-map";
import { useBrowserSigner } from "@/hooks/use-browser-signer";
import { isAddress } from "ethers";
import { Loader2, PlusCircle, Check, AlertCircle, ShieldAlert, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AddFacultyAddressProps {
  onSuccess?: () => void;
}

// Komponenta za dodavanje nove adrese fakulteta
export function AddFacultyAddress({ onSuccess }: AddFacultyAddressProps) {
  const { toast } = useToast();
  const { signer } = useBrowserSigner();
  const [address, setAddress] = useState("");
  const [facultyName, setFacultyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasRights, setHasRights] = useState<boolean | null>(null);
  const [checkingPermissions, setCheckingPermissions] = useState(false);

  // Proveravamo da li korisnik ima pravo glasa
  useEffect(() => {
    const checkRights = async () => {
      if (!signer) {
        setHasRights(false);
        return;
      }

      setCheckingPermissions(true);
      try {
        const { governor } = getDeployedContracts(signer);
        const result = await hasVotingRights(signer, governor);
        setHasRights(result);
      } catch (err) {
        console.error("Greška pri proveri prava:", err);
        setHasRights(false);
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkRights();
  }, [signer]);

  // Handler za dodavanje nove adrese
  const handleAddAddress = async () => {
    if (!signer) {
      toast({
        title: "Greška",
        description: "Niste povezani sa novčanikom.",
        variant: "destructive",
      });
      return;
    }

    // Resetujemo stanja
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      // Validacija adrese
      if (!isAddress(address)) {
        setError("Unesite validnu Ethereum adresu.");
        setIsLoading(false);
        return;
      }

      // Validacija imena fakulteta
      if (!facultyName.trim()) {
        setError("Unesite ime fakulteta.");
        setIsLoading(false);
        return;
      }

      // Registrujemo adresu na blockchain-u
      const result = await registerNewVoter(signer, address);

      if (!result.success) {
        setError(result.error || "Došlo je do greške pri registraciji adrese.");
        setIsLoading(false);
        return;
      }

      // Ažuriramo lokalno mapiranje adresa
      updateAddressNameMap(address, facultyName);

      // Resetujemo polja i prikazujemo poruku uspeha
      setSuccess(true);
      setAddress("");
      setFacultyName("");
      
      toast({
        title: "Uspešno dodavanje",
        description: `Adresa "${address}" je uspešno registrovana kao "${facultyName}".`,
        variant: "default",
      });
      
      // Ako postoji callback za uspeh, pozivamo ga
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error("Greška pri dodavanju adrese:", err);
      setError(err instanceof Error ? err.message : "Nepoznata greška");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Dodaj novu adresu fakulteta</CardTitle>
        <CardDescription>
          Registrujte novu adresu fakulteta koja će imati pravo glasa u sistemu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {checkingPermissions ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Proveravanje prava pristupa...</span>
          </div>
        ) : hasRights === false ? (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Nemate pravo pristupa</AlertTitle>
            <AlertDescription>
              Samo članovi sistema sa pravom glasa mogu da dodaju nove fakultete. 
              Obratite se nekom od postojećih članova sistema.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {error && (
              <div className="bg-destructive/15 p-3 rounded-md flex items-center text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 p-3 rounded-md flex items-center text-sm text-green-700">
                <Check className="h-4 w-4 mr-2" />
                Adresa je uspešno dodata u sistem.
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="address">Ethereum adresa</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="faculty-name">Ime fakulteta</Label>
              <Input
                id="faculty-name"
                placeholder="npr. Fakultet 7"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        {hasRights && (
          <Button 
            className="w-full" 
            onClick={handleAddAddress}
            disabled={isLoading || !address || !facultyName}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registracija u toku...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Dodaj adresu fakulteta
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 