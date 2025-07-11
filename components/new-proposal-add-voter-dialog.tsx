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
import { CheckCircle2, PlusCircle, AlertCircle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, ReactElement } from "react";
import { useProposals } from "@/hooks/use-proposals";
import { UIAddVoterVotableItem } from "@/types/proposal";
import { useUserService } from "@/hooks/use-userservice";

interface NewVoterDialogProps {
  customClassName?: string;
  customText?: ReactElement;
}

export function NewVoterDialog({
  customClassName,
  customText,
}: NewVoterDialogProps) {
  const { isCurrentUserEligibleVoter } = useUserService();
  if (!isCurrentUserEligibleVoter) {
    return <></>;
  }
  const {
    proposalService,
    loading: proposalLoading,
    setLoading: setProposalLoading,
  } = useProposals();
  const [newVoterAddress, setNewVoterAddress] = useState<string>("");
  const [facultyName, setFacultyName] = useState<string>("");
  const [proposalSubmitted, setProposalSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [infoDots, setInfoDots] = useState<string>("");

  const handleProposalSubmit = async () => {
    if (newVoterAddress.trim() === "") {
      setError("Адреса је обавезна.");
      return;
    }

    if (facultyName.trim() === "") {
      setError("Име факултета је обавезно.");
      return;
    }

    setError(null);
    setInfoMessage(null);
    setProposalLoading(true);

    try {
      const voteItem: UIAddVoterVotableItem = {
        newVoterAddress,
        newVoterName: facultyName,
      };
      const result = await proposalService?.uploadAddVoterProposal(voteItem);

      console.log(
        "Предлог послат додавање адресе:",
        newVoterAddress,
        "Hash:",
        result
      );
      setError(null);
      setInfoMessage(null);
      setProposalSubmitted(true);

      setTimeout(() => {
        setNewVoterAddress("");
        setFacultyName("");
      }, 3000);
    } catch (error) {
      console.error("Грешка при креирању предлога:", error);
      setInfoMessage(null);

      let errorMessage = "Дошло је до грешке при креирању предлога.";

      if (error instanceof Error) {
        const errorString = error.toString();
        const errorWithCode = error as any;

        if (errorString.includes("GovernorInsufficientProposerVotes")) {
          errorMessage =
            "Немате довољно токена за креирање предлога. За креирање предлога потребно је имати најмање 1 EVSD токен и делегирати их себи.";
        } else if (
          errorString.includes("user rejected") ||
          errorString.includes("user denied") ||
          errorString.includes("action rejected")
        ) {
          errorMessage =
            "Трансакција је одбијена од стране корисника. Потребно је одобрити трансакцију у новчанику.";
        } else if (errorString.includes("insufficient funds")) {
          errorMessage =
            "Недовољно средстава за плаћање трошкова трансакције (ETH).";
        } else if (errorString.includes("ERC20InsufficientBalance")) {
          errorMessage = "Недовољно EVSD токена за креирање предлога.";
        } else if (errorWithCode.code === "BAD_DATA") {
          errorMessage =
            "Проблем са прослеђеним подацима. Проверите да ли је адреса токена исправна и параметри одговарајући.";
        } else if (errorWithCode.code === "CALL_EXCEPTION") {
          errorMessage =
            "Трансакција је одбијена. Могућ проблем са адресом паметног уговора.";
        } else if (errorWithCode.code === "UNPREDICTABLE_GAS_LIMIT") {
          errorMessage =
            "Неуспешна процена трошкова гаса. Проверите да ли испуњавате услове за предлог.";
        } else if (errorWithCode.code === "INSUFFICIENT_FUNDS") {
          errorMessage =
            "Недовољно средстава за плаћање трошкова трансакције (ETH).";
        } else {
          errorMessage = `Грешка: ${errorString}`;
        }
      }

      setError(errorMessage);
    } finally {
      setProposalLoading(false);
    }
  };

  useEffect(() => {
    if (!infoMessage) {
      return;
    }

    const interval = setInterval(() => {
      setInfoDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);

    return () => clearInterval(interval);
  }, [infoMessage]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className={customClassName || ""}>
          {customText || (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              Предложи новог члана Е-ВСД
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] w-[90%] sm:w-full overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="mt-4 sm:mt-0">
            Предлог за додавање новог члана Е-ВСД
          </DialogTitle>
          <DialogDescription>
            Попуните формулар да бисте предложили додавање новог члана.
          </DialogDescription>
        </DialogHeader>
        {proposalSubmitted ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Предлог успешно послат!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Ваш предлог је додат и доступан је за гласање.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-red-600 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium">Грешка</h3>
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {infoMessage && !error && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-blue-600 flex items-start gap-2">
                <Info className="h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium">
                    Обрада<span>{infoDots}</span>
                  </h3>
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {infoMessage}
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="voterAddress">Адреса новог члана</Label>
                <Input
                  id="voterAddress"
                  value={newVoterAddress}
                  onChange={(e) => setNewVoterAddress(e.target.value)}
                  placeholder="Унесите адресу"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="facultyName">Име факултета</Label>
                <Input
                  id="facultyName"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  placeholder="Унесите име факултета"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleProposalSubmit}
                disabled={proposalLoading}
              >
                {proposalLoading ? "Слање..." : "Додај предлог"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
