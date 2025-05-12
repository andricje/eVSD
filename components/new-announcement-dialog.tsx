import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Megaphone, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, ReactElement } from "react";
import { createAnnouncement } from "@/lib/blockchain-utils";
import { useBrowserSigner } from "@/hooks/use-browser-signer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface NewAnnouncementDialogProps {
  customClassName?: string;
  customText?: ReactElement;
}

export function NewAnnouncementDialog({ customClassName, customText }: NewAnnouncementDialogProps) {
  const { signer, signerAddress } = useBrowserSigner();
  const [announcementContent, setAnnouncementContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!signer) {
      setError("Novčanik nije povezan.");
      return;
    }

    if (!announcementContent.trim()) {
      setError("Sadržaj obraćanja je obavezan.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // Prikazujemo status izveštaja
      setError("Priprema kreiranje obraćanja...");
      
      // Kreiranje obraćanja
      setError("Kreiranje obraćanja... (potvrdite transakciju u novčaniku)");
      const result = await createAnnouncement(
        signer,
        announcementContent
      );

      if (result) {
        setError(null);
        setSuccess(true);
        console.log("Obraćanje uspešno kreirano:", result);
        
        // Resetovanje forme nakon 3 sekunde
        setTimeout(() => {
          setAnnouncementContent("");
          setSuccess(false);
        }, 3000);
      } else {
        throw new Error("Kreiranje obraćanja nije uspelo.");
      }
    } catch (error) {
      console.error("Greška pri kreiranju obraćanja:", error);

      let errorMessage = "Došlo je do greške pri kreiranju obraćanja.";
      
      if (error instanceof Error) {
        const errorString = error.toString();

        if (errorString.includes("user rejected transaction")) {
          errorMessage =
            "Transakcija je odbijena od strane korisnika. Potrebno je odobriti transakciju u novčaniku.";
        } else if (errorString.includes("insufficient funds")) {
          errorMessage =
            "Nedovoljno sredstava za plaćanje troškova transakcije (ETH).";
        } else if (errorString.includes("execution reverted")) {
          errorMessage = "Niste administrator i nemate dozvolu za kreiranje obraćanja.";
        } else {
          errorMessage = `Greška: ${errorString}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className={customClassName || "bg-indigo-600 hover:bg-indigo-700 text-white h-auto py-2.5"}>
          {customText || (
            <>
              <Megaphone className="h-5 w-5 mr-2" />
              Novo obraćanje fakulteta
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Novo obraćanje fakulteta
          </DialogTitle>
          <DialogDescription>
            Kreiraj novo obraćanje koje će biti prikazano svim korisnicima platforme.
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium">Obraćanje uspešno objavljeno!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Vaše obraćanje je uspešno sačuvano na blockchain-u i biće prikazano korisnicima pri prvom sledećem prijavljivanju.
            </p>
          </div>
        ) : (
          <>
            {error && !error.includes("Kreiranje") && !error.includes("Priprema") && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Greška</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {error && (error.includes("Kreiranje") || error.includes("Priprema")) && (
              <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <Info className="h-4 w-4" />
                <AlertTitle>U toku</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="announcement-content" className="text-base">Sadržaj obraćanja</Label>
                <Textarea
                  id="announcement-content"
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="Unesite sadržaj obraćanja..."
                  rows={8}
                  className="resize-none"
                  disabled={submitting}
                />
              </div>
              
              <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <Info className="h-4 w-4" />
                <AlertTitle>Važno obaveštenje</AlertTitle>
                <AlertDescription>
                  <p>Obraćanja se čuvaju na blockchain-u i biće vidljiva svim korisnicima sistema.</p>
                  <p className="mt-1">Samo administratori mogu da kreiraju obraćanja.</p>
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full animate-spin mr-2"></div>
                    Slanje u toku...
                  </>
                ) : (
                  <>
                    <Megaphone className="h-4 w-4" />
                    Objavi obraćanje
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 