import { Proposal } from "@/types/proposal";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { useProposals } from "@/hooks/use-proposals";
import { STRINGS } from "@/constants/strings";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CancelProposalButton({ proposal }: { proposal: Proposal }) {
  const { toast } = useToast();
  const { proposalService } = useProposals();
  const handleCancelProposal = async () => {
    if (!proposalService) {
      toast({
        title: "Greška",
        description:
          "Nije moguće otkazati predlog. Niste povezani sa novčanikom.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await proposalService.cancelProposal(proposal);

      if (success) {
        toast({
          title: "Uspešno otkazan predlog",
          description: `Predlog "${proposal.title}" je uspešno otkazan.`,
          variant: "default",
        });
      } else {
        throw new Error("Nije moguće otkazati predlog.");
      }
    } catch (error) {
      console.error("Greška pri otkazivanju predloga:", error);
      toast({
        title: "Greška",
        description: `Došlo je do greške prilikom otkazivanja predloga: ${
          error instanceof Error ? error.message : "Nepoznata greška"
        }`,
        variant: "destructive",
      });
    }
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          {STRINGS.buttons.cancelProposal}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Otkazivanje predloga</AlertDialogTitle>
          <AlertDialogDescription>
            Da li ste sigurni da želite da otkažete predlog "{proposal.title}"?
            Ova akcija se ne može poništiti.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Odustani</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancelProposal}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            Otkaži predlog
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
