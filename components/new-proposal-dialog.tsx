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
import {
  CheckCircle2,
  FileUp,
  PlusCircle,
  AlertCircle,
  Info,
  Trash2,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import {
  createProposalDoNothing,
  getDeployedContracts,
} from "@/lib/blockchain-utils";
import { useBrowserSigner } from "@/hooks/use-browser-signer";
import { ethers } from "ethers";
import { ProposalSubItem } from "@/types/proposal";
import { Switch } from "@/components/ui/switch";

export function NewProposalDialog() {
  const { signer } = useBrowserSigner();
  const [newProposal, setNewProposal] = useState({
    title: "",
    description: "",
    urgent: false,
    document: null as File | null,
    isMultilayered: false,
    subItems: [] as ProposalSubItem[],
  });
  const [proposalSubmitted, setProposalSubmitted] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsTokens, setNeedsTokens] = useState(false);

  // Проверавамо стање токена при отварању дијалога
  useEffect(() => {
    if (!signer) {
      return;
    }

    const checkTokenBalance = async () => {
      try {
        const deployedContracts = getDeployedContracts(signer);
        const governor = deployedContracts.governor;
        const tokenAddress = await governor.token();
        const token = new ethers.Contract(
          tokenAddress,
          [
            "function balanceOf(address) view returns (uint256)",
            "function proposalThreshold() view returns (uint256)",
          ],
          signer
        );

        const address = await signer.getAddress();
        const balance = await token.balanceOf(address);
        const threshold = await governor.proposalThreshold();

        setNeedsTokens(balance < threshold);
      } catch (e) {
        console.error("Грешка при провери стања токена:", e);
      }
    };

    checkTokenBalance();
  }, [signer]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewProposal({ ...newProposal, document: e.target.files[0] });
      setDocumentName(e.target.files[0].name);
    }
  };

  const addSubItem = () => {
    const newSubItem: ProposalSubItem = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      yourVote: "didntVote",
      votesForAddress: {},
    };
    
    setNewProposal({
      ...newProposal,
      subItems: [...newProposal.subItems, newSubItem],
    });
  };

  const updateSubItem = (id: string, field: keyof ProposalSubItem, value: string) => {
    setNewProposal({
      ...newProposal,
      subItems: newProposal.subItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const removeSubItem = (id: string) => {
    setNewProposal({
      ...newProposal,
      subItems: newProposal.subItems.filter(item => item.id !== id),
    });
  };

  const handleProposalSubmit = async () => {
    if (!signer) {
      setError("Новчаник није повезан.");
      return;
    }

    if (!newProposal.description.trim()) {
      setError("Опис предлога је обавезан.");
      return;
    }

    if (!newProposal.title.trim()) {
      setError("Наслов предлога је обавезан.");
      return;
    }

    if (newProposal.isMultilayered) {
      // Проверавамо да ли су сви подпредлози попуњени
      if (newProposal.subItems.length === 0) {
        setError("За вишеслојни предлог морате додати најмање једну подтачку.");
        return;
      }

      for (const item of newProposal.subItems) {
        if (!item.title.trim() || !item.description.trim()) {
          setError("Сви наслови и описи подтачака су обавезни.");
          return;
        }
      }
    }

    setError(null);
    setLoading(true);

    try {
      const deployedContracts = getDeployedContracts(signer);
      const token = deployedContracts.token;
      const governor = deployedContracts.governor;

      // Прво приказујемо информацију да проверавамо стање
      setError("Провера стања токена и делегација гласова...");

      // Проверавамо адресу корисника за лакше праћење
      const signerAddress = await signer.getAddress();
      console.log("Корисник:", signerAddress);

      // Добављамо информације о стању токена и гласовима
      const balance = await token.balanceOf(signerAddress);
      const votes = await token.getVotes(signerAddress);
      const threshold = await governor.proposalThreshold();

      console.log(`Баланс токена: ${ethers.formatUnits(balance, 18)}`);
      console.log(`Гласачка моћ: ${ethers.formatUnits(votes, 18)}`);
      console.log(`Потребно за предлог: ${ethers.formatUnits(threshold, 18)}`);

      // Ако корисник нема довољно токена или гласачке моћи, покушавамо то да решимо
      if (balance < threshold || votes < threshold) {
        // Прво проверавамо да ли има токена али их није делегирао
        if (balance >= threshold && votes < threshold) {
          setError("Делегирање токена... (потврдите трансакцију у новчанику)");
          await token.delegate(signerAddress);
          console.log("Токени успешно делегирани");
        }

        // Добављамо нову гласачку моћ
        const newVotes = await token.getVotes(signerAddress);
        console.log(`Нова гласачка моћ: ${ethers.formatUnits(newVotes, 18)}`);

        // Ако и даље нема довољно гласачке моћи, не можемо креирати предлог
        if (newVotes < threshold) {
          throw new Error("GovernorInsufficientProposerVotes");
        }
      }

      // Креирамо предлог
      setError("Креирање предлога... (потврдите трансакцију у новчанику)");
      const result = await createProposalDoNothing(
        signer,
        deployedContracts.governor,
        newProposal.description,
        newProposal.title,
        newProposal.isMultilayered,
        newProposal.subItems
      );

      console.log("Предлог послат:", newProposal, "Hash:", result);
      setError(null);
      setProposalSubmitted(true);

      // Reset форме након 3 секунде
      setTimeout(() => {
        setNewProposal({
          title: "",
          description: "",
          urgent: false,
          document: null,
          isMultilayered: false,
          subItems: [],
        });
        setDocumentName("");
      }, 3000);
    } catch (error) {
      console.error("Грешка при креирању предлога:", error);

      // Детаљније руковање грешкама за јаснију поруку кориснику
      let errorMessage = "Дошло је до грешке при креирању предлога.";

      if (error instanceof Error) {
        const errorString = error.toString();

        if (errorString.includes("GovernorInsufficientProposerVotes")) {
          errorMessage =
            "Немате довољно токена за креирање предлога. За креирање предлога потребно је имати најмање 1 EVSD токен и делегирати их себи.";
        } else if (errorString.includes("user rejected transaction")) {
          errorMessage =
            "Трансакција је одбијена од стране корисника. Потребно је одобрити трансакцију у новчанику.";
        } else if (errorString.includes("insufficient funds")) {
          errorMessage =
            "Недовољно средстава за плаћање трошкова трансакције (ETH).";
        } else if (errorString.includes("ERC20InsufficientBalance")) {
          errorMessage = "Недовољно EVSD токена за креирање предлога.";
        } else {
          // Приказујемо стварну поруку грешке у развојном окружењу
          errorMessage = `Грешка: ${errorString}`;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Додај нови предлог
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Нови предлог за гласање</DialogTitle>
          <DialogDescription>
            Попуните формулар да бисте додали нови предлог за гласање.
          </DialogDescription>
        </DialogHeader>
        {proposalSubmitted ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Предлог успешно послат!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Ваш предлог је додат на временску линију и доступан је за гласање.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-red-600 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium">Грешка</h3>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {needsTokens && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 text-amber-700 flex items-start gap-2">
                <Info className="h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium">Потребни су токени</h3>
                  <p className="text-sm">
                    За креирање предлога потребно је најмање 1 EVSD токен.
                    Токени ће бити аутоматски додати када кликнете на
                    &quot;Додај предлог&quot;.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Наслов предлога</Label>
                <Input
                  id="title"
                  value={newProposal.title}
                  onChange={(e) =>
                    setNewProposal({
                      ...newProposal,
                      title: e.target.value,
                    })
                  }
                  placeholder="Унесите наслов предлога"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Опис предлога</Label>
                <Textarea
                  id="description"
                  value={newProposal.description}
                  onChange={(e) =>
                    setNewProposal({
                      ...newProposal,
                      description: e.target.value,
                    })
                  }
                  placeholder="Детаљно опишите ваш предлог"
                  rows={6}
                />
              </div>

              {/* Опција за вишеслојни предлог */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label htmlFor="multilayered-proposal" className="mb-1">Вишеслојни предлог</Label>
                  <span className="text-xs text-muted-foreground">
                    Омогућава гласање о предлогу у начелу и појединачним тачкама
                  </span>
                </div>
                <Switch
                  id="multilayered-proposal"
                  checked={newProposal.isMultilayered}
                  onCheckedChange={(checked) =>
                    setNewProposal({
                      ...newProposal,
                      isMultilayered: checked,
                    })
                  }
                />
              </div>

              {/* Подтачке предлога - видљиве само ако је вишеслојни предлог */}
              {newProposal.isMultilayered && (
                <div className="space-y-4 mt-2">
                  <div className="flex items-center justify-between">
                    <Label>Подтачке предлога</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSubItem}
                      className="flex items-center gap-1"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Додај подтачку</span>
                    </Button>
                  </div>

                  {newProposal.subItems.length === 0 && (
                    <div className="bg-muted p-4 text-center rounded-md">
                      <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Додајте подтачке предлога на које ће се гласати појединачно
                      </p>
                    </div>
                  )}

                  {newProposal.subItems.map((item, index) => (
                    <div 
                      key={item.id}
                      className="bg-slate-50 border rounded-lg p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Подтачка {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubItem(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          placeholder="Наслов подтачке"
                          value={item.title}
                          onChange={(e) => updateSubItem(item.id, 'title', e.target.value)}
                        />
                        
                        <Textarea
                          placeholder="Опис подтачке предлога"
                          value={item.description}
                          onChange={(e) => updateSubItem(item.id, 'description', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={newProposal.urgent}
                  onChange={(e) =>
                    setNewProposal({
                      ...newProposal,
                      urgent: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="urgent">Означите као хитно</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="document">Приложите документ (опционо)</Label>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="document"
                    className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted"
                  >
                    <FileUp className="h-4 w-4" />
                    <span>Изаберите фајл</span>
                  </Label>
                  <Input
                    id="document"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                  {documentName && (
                    <span className="text-sm text-muted-foreground">
                      {documentName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleProposalSubmit}
                disabled={loading}
              >
                {loading ? "Слање..." : "Додај предлог"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
