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
  PlusCircle,
  AlertCircle,
  Info,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, ReactElement } from "react";
import {
  IsUIAddVoterVotableItem,
  UIProposal,
  UIVotableItem,
} from "@/types/proposal";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useProposals } from "@/hooks/use-proposals";
import { STRINGS } from "@/constants/strings";
import { v4 as uuidv4 } from "uuid";

interface NewProposalDialogProps {
  customClassName?: string;
  customText?: ReactElement;
}

export function NewProposalDialog({
  customClassName,
  customText,
}: NewProposalDialogProps) {
  const { proposalService } = useProposals();
  const [open, setOpen] = useState(false);
  const [newProposal, setNewProposal] = useState<UIProposal>({
    title: "",
    description: "",
    file: undefined,
    voteItems: [],
  });
  const [proposalSubmitted, setProposalSubmitted] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [infoDots, setInfoDots] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setInfoMessage(null);
    }
  }, [open]);

  useEffect(() => {
    if (proposalSubmitted) {
      const timer = setTimeout(() => {
        setNewProposal({
          title: "",
          description: "",
          file: undefined,
          voteItems: [],
        });
        setDocumentName("");
        setProposalSubmitted(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [proposalSubmitted]);

  useEffect(() => {
    if (newProposal.voteItems.length === 0) {
      const defaultVoteItem: UIVotableItem = {
        title: "",
        description: "",
        UIOnlyId: uuidv4(),
      };
      setNewProposal((prev) => ({
        ...prev,
        voteItems: [defaultVoteItem],
      }));
    }
  }, [newProposal.voteItems.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewProposal({ ...newProposal, file: e.target.files[0] });
      setDocumentName(e.target.files[0].name);
    }
  };

  const addSubItem = () => {
    const newVoteItem: UIVotableItem = {
      title: "",
      description: "",
      UIOnlyId: uuidv4(),
    };

    setNewProposal({
      ...newProposal,
      voteItems: [...newProposal.voteItems, newVoteItem],
    });
  };

  const updateSubItem = (
    itemToUpdate: UIVotableItem,
    field: keyof UIVotableItem,
    value: string
  ) => {
    setNewProposal({
      ...newProposal,
      voteItems: newProposal.voteItems.map((item) =>
        item === itemToUpdate ? { ...item, [field]: value } : item
      ),
    });
  };

  const removeSubItem = (itemToRemove: UIVotableItem) => {
    setNewProposal({
      ...newProposal,
      voteItems: newProposal.voteItems.filter((item) => item !== itemToRemove),
    });
  };

  const moveSubItem = (itemToMove: UIVotableItem, direction: "up" | "down") => {
    const currentIndex = newProposal.voteItems.findIndex(
      (item) => item === itemToMove
    );
    if (currentIndex === -1) {
      return;
    }

    const newSubItems = [...newProposal.voteItems];

    if (direction === "up" && currentIndex > 0) {
      [newSubItems[currentIndex], newSubItems[currentIndex - 1]] = [
        newSubItems[currentIndex - 1],
        newSubItems[currentIndex],
      ];
    } else if (direction === "down" && currentIndex < newSubItems.length - 1) {
      [newSubItems[currentIndex], newSubItems[currentIndex + 1]] = [
        newSubItems[currentIndex + 1],
        newSubItems[currentIndex],
      ];
    }

    setNewProposal({
      ...newProposal,
      voteItems: newSubItems,
    });
  };

  const duplicateSubItem = (itemToDuplicate: UIVotableItem) => {
    const originalItem = newProposal.voteItems.find(
      (item) => item === itemToDuplicate
    );
    if (!originalItem || IsUIAddVoterVotableItem(originalItem)) {
      return;
    }

    const newVoteItem: UIVotableItem = {
      ...originalItem,
      title: `${originalItem.title} (kopija)`,
      UIOnlyId: uuidv4(),
    };

    setNewProposal({
      ...newProposal,
      voteItems: [...newProposal.voteItems, newVoteItem],
    });
  };

  const handleProposalSubmit = async () => {
    if (!newProposal.description.trim()) {
      setError(STRINGS.newProposal.error.descriptionRequired);
      return;
    }

    if (!newProposal.title.trim()) {
      setError(STRINGS.newProposal.error.titleRequired);
      return;
    }

    // Проверавамо да ли су сви подпредлози попуњени
    if (newProposal.voteItems.length === 0) {
      setError(STRINGS.newProposal.error.noVoteItems);
      return;
    }

    for (const item of newProposal.voteItems) {
      if (IsUIAddVoterVotableItem(item)) {
        throw new Error("Unexpected vote item type");
      }
      if (!item.title.trim() || !item.description.trim()) {
        setError(STRINGS.newProposal.error.subitemsIncomplete);
        return;
      }
    }

    setError(null);
    setLoading(true);

    try {
      setInfoMessage(STRINGS.newProposal.status.creating);

      const result = await proposalService?.uploadProposal(newProposal);

      setError(null);
      setInfoMessage(null);
      setProposalSubmitted(true);

      setShowSuccessMessage(true);

      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } catch (error) {
      setInfoMessage(null);

      let errorMessage = STRINGS.newProposal.error.generic();

      if (error instanceof Error) {
        const errorString = error.toString();
        const errorWithCode = error as any;

        console.log(error);
        console.log(errorWithCode);
        console.log(errorWithCode.code);

        if (errorString.includes("GovernorInsufficientProposerVotes")) {
          errorMessage = STRINGS.newProposal.error.insufficientEVSDTokens;
        } else if (
          errorString.includes("user rejected") ||
          errorString.includes("user denied") ||
          errorString.includes("action rejected")
        ) {
          errorMessage = STRINGS.newProposal.error.txRejectedByUser;
        } else if (errorString.includes("insufficient funds")) {
          errorMessage = STRINGS.newProposal.error.insufficientETH;
        } else if (errorString.includes("ERC20InsufficientBalance")) {
          errorMessage = STRINGS.newProposal.error.insufficientEVSDTokens;
        } else if (errorWithCode.code === "BAD_DATA") {
          errorMessage = STRINGS.newProposal.error.badData;
        } else if (errorWithCode.code === "CALL_EXCEPTION") {
          errorMessage = STRINGS.newProposal.error.callException;
        } else if (errorWithCode.code === "UNPREDICTABLE_GAS_LIMIT") {
          errorMessage = STRINGS.newProposal.error.generic(errorString);
        } else if (errorWithCode.code === "INSUFFICIENT_FUNDS") {
          errorMessage = STRINGS.newProposal.error.insufficientETH;
        } else if (errorString.includes("network changed")) {
          errorMessage = STRINGS.newProposal.error.networkChanged;
        } else if (errorWithCode.code === "NETWORK_ERROR") {
          errorMessage = STRINGS.newProposal.error.networkError;
        } else {
          errorMessage = STRINGS.newProposal.error.generic(errorString);
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={customClassName || ""}>
          {customText || (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              {STRINGS.newProposal.dialog.addNew}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] w-[90%] sm:w-full overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle>{STRINGS.newProposal.dialog.title}</DialogTitle>
          <DialogDescription>
            {STRINGS.newProposal.dialog.description}
          </DialogDescription>
        </DialogHeader>

        {showSuccessMessage ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">
              {STRINGS.newProposal.success.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {STRINGS.newProposal.success.description}
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-red-600 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium">
                    {STRINGS.newProposal.error.title}
                  </h3>
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
                    {STRINGS.newProposal.info.processing}
                    <span>{infoDots}</span>
                  </h3>
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {infoMessage}
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">
                  {STRINGS.newProposal.form.title.label}
                </Label>
                <Input
                  id="title"
                  value={newProposal.title}
                  onChange={(e) =>
                    setNewProposal({
                      ...newProposal,
                      title: e.target.value,
                    })
                  }
                  className="text-sm"
                  placeholder={STRINGS.newProposal.form.title.placeholder}
                  disabled={loading || proposalSubmitted}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">
                  {STRINGS.newProposal.form.description.label}
                </Label>
                <Textarea
                  id="description"
                  value={newProposal.description}
                  onChange={(e) =>
                    setNewProposal({
                      ...newProposal,
                      description: e.target.value,
                    })
                  }
                  className="text-sm"
                  placeholder={STRINGS.newProposal.form.description.placeholder}
                  rows={6}
                  disabled={loading || proposalSubmitted}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label htmlFor="multilayered-proposal" className="mb-1">
                    {STRINGS.newProposal.form.voteItems.label}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {STRINGS.newProposal.form.voteItems.hint}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mt-2">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <Label className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <span>
                      {STRINGS.newProposal.form.voteItems.label} (
                      {newProposal.voteItems.length})
                    </span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSubItem}
                    className="flex items-center gap-1"
                    disabled={loading || proposalSubmitted}
                  >
                    {/* <PlusCircle className="h-3.5 w-3.5" /> */}
                    {STRINGS.newProposal.form.subItem.add}
                  </Button>
                </div>

                {newProposal.voteItems.length === 0 && (
                  <div className="bg-muted p-4 text-center rounded-md">
                    <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {STRINGS.newProposal.form.voteItems.none}
                    </p>
                  </div>
                )}

                <ScrollArea
                  className={
                    newProposal.voteItems.length > 2 ? "h-[300px] pr-4" : ""
                  }
                >
                  {newProposal.voteItems.map((item, index) => (
                    <div
                      key={item.UIOnlyId}
                      className="bg-slate-50 border rounded-lg mb-3 overflow-hidden"
                    >
                      <Accordion
                        type="single"
                        collapsible
                        defaultValue={
                          newProposal.voteItems.length > 0
                            ? newProposal.voteItems[
                                newProposal.voteItems.length - 1
                              ].UIOnlyId
                            : ""
                        }
                      >
                        <AccordionItem
                          value={item.UIOnlyId}
                          className="border-b-0"
                        >
                          <div className="max-w-full w-full flex items-center justify-between p-3 bg-slate-100 border-b">
                            <AccordionTrigger className="w-32 sm:w-96">
                              <div className="flex items-center gap-2 w-full min-w-0 overflow-hidden">
                                <div className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                  {index + 1}
                                </div>
                                <h4 className="font-medium text-ellipsis overflow-hidden whitespace-nowrap min-w-0 flex-1 text-left line-clamp-1">
                                  {item.title ||
                                    `${STRINGS.newProposal.form.subItem.default} ${index + 1}`}
                                </h4>
                              </div>
                            </AccordionTrigger>
                            <div className="flex items-center space-x-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveSubItem(item, "up")}
                                disabled={index === 0}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveSubItem(item, "down")}
                                disabled={
                                  index === newProposal.voteItems.length - 1
                                }
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => duplicateSubItem(item)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSubItem(item)}
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <AccordionContent className="p-3">
                            <div className="space-y-3">
                              <div>
                                <Label
                                  htmlFor={`title-${item.UIOnlyId}`}
                                  className="text-xs font-medium mb-1 block"
                                >
                                  {STRINGS.newProposal.form.subItem.title.label}
                                </Label>
                                <Input
                                  id={`title-${item.UIOnlyId}`}
                                  placeholder={
                                    STRINGS.newProposal.form.subItem.title
                                      .placeholder
                                  }
                                  className="text-xs max-w-full"
                                  value={item.title}
                                  onChange={(e) =>
                                    updateSubItem(item, "title", e.target.value)
                                  }
                                  disabled={loading || proposalSubmitted}
                                />
                              </div>

                              <div>
                                <Label
                                  htmlFor={`description-${item.UIOnlyId}`}
                                  className="text-xs font-medium mb-1 block"
                                >
                                  {
                                    STRINGS.newProposal.form.subItem.description
                                      .label
                                  }
                                </Label>
                                <Textarea
                                  id={`description-${item.UIOnlyId}`}
                                  placeholder={
                                    STRINGS.newProposal.form.subItem.description
                                      .placeholder
                                  }
                                  value={item.description}
                                  onChange={(e) =>
                                    updateSubItem(
                                      item,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  className="text-xs max-w-full"
                                  rows={3}
                                  disabled={loading || proposalSubmitted}
                                />
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {/* <div className="grid gap-2">
                <Label htmlFor="document">
                  {STRINGS.newProposal.form.attachment.label}
                </Label>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="document"
                    className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted"
                  >
                    <FileUp className="h-4 w-4" />
                    <span>{STRINGS.newProposal.form.attachment.button}</span>
                  </Label>
                  <Input
                    id="document"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    disabled={loading || proposalSubmitted}
                  />
                  {documentName && (
                    <span className="text-sm text-muted-foreground">
                      {documentName}
                    </span>
                  )}
                </div>
              </div> */}
            </div>

            <DialogFooter>
              <Button
                type="submit"
                onClick={handleProposalSubmit}
                disabled={loading || proposalSubmitted}
              >
                {loading
                  ? STRINGS.newProposal.form.submit.loading
                  : STRINGS.newProposal.form.submit.default}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
