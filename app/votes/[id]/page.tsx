"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Timer,
  Lock,
  AlertTriangle,
} from "lucide-react";
import {
  castVote,
  convertAddressToName,
  convertVoteOptionToGovernor,
  countTotalVotes,
  formatDate,
  getDeployedContracts,
  getRemainingTime,
  isQuorumReached,
  isVotingComplete,
  QUORUM,
  tryParseAsBigInt,
} from "@/lib/utils";
import { useProposals } from "@/hooks/use-proposals";
import { Header } from "@/components/header";
import { StatusBadge, VoteIcon } from "@/components/badges";
import { VoteOption } from "@/types/proposal";
import { useBrowserSigner } from "@/hooks/use-browser-signer";
import { VoteCounter } from "@/components/vote-counter";

export default function VoteDetailPage() {
  const { signer } = useBrowserSigner();
  const params = useParams<{ id: string }>();
  // TODO: Handle invalid proposal id
  const proposalId = tryParseAsBigInt(params.id);
  // There is no way to fetch proposal description and proposer id except filtering all events, so just fetch all proposals and filter
  const allProposals = useProposals();

  const [selectedVote, setSelectedVote] = useState<VoteOption>("didntVote");
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [voteRegistered, setVoteRegistered] = useState(false);

  const selectedProposal = allProposals.find(
    (proposal) => proposal.id === proposalId
  );

  useEffect(() => {
    if (selectedVote !== "didntVote" && signer && selectedProposal) {
      const deployedContracts = getDeployedContracts(signer);
      castVote(
        signer,
        deployedContracts.governor,
        selectedProposal.id,
        convertVoteOptionToGovernor(selectedVote)
      ).then(() => {
        setVoteRegistered(true);
      });
    }
  }, [signer, selectedVote, selectedProposal]);

  const handleVote = (vote: VoteOption) => {
    setSelectedVote(vote);
  };

  // Dodajemo funkciju za potvrđivanje glasa
  const handleSubmitVote = () => {
    if (selectedVote !== "didntVote") {
      setVoteSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full max-w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <Link
            href="/dashboard"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Povratak na Dashboard
          </Link>

          {/* {<WalletInfo />} */}

          {selectedProposal && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold">
                    {selectedProposal.title}
                  </h1>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4" />
                    Dodato: {formatDate(selectedProposal.dateAdded)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={selectedProposal.status}
                    expiresAt={selectedProposal.closesAt}
                  />
                  {selectedProposal.status !== "closed" && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-500"
                    >
                      <Timer className="h-3 w-3 mr-1" />
                      Završava se za{" "}
                      {getRemainingTime(selectedProposal.closesAt)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Детаљи предлога</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Опис</h3>
                      <p className="text-sm">{selectedProposal.description}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Информације</h3>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between py-1 border-b">
                          <span>Предлагач</span>
                          <span className="font-medium">
                            {convertAddressToName(selectedProposal.author)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span>Статус кворума</span>
                          <span
                            className={`font-medium ${isQuorumReached(selectedProposal) ? "text-green-600" : "text-amber-600"}`}
                          >
                            {isQuorumReached(selectedProposal)
                              ? "Достигнут"
                              : "Није достигнут"}
                            {!isQuorumReached(selectedProposal) &&
                              ` (потребно још ${QUORUM - countTotalVotes(selectedProposal)})`}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span>Статус гласања</span>
                          <span className="font-medium">
                            {selectedProposal.status === "closed" &&
                              "Затворено"}
                            {selectedProposal.status === "open" && "Активно"}
                          </span>
                        </div>
                        {isQuorumReached(selectedProposal) && (
                          <div className="flex justify-between py-1 border-b">
                            <span>Време до завршетка</span>
                            <span className="font-medium text-amber-600">
                              {getRemainingTime(selectedProposal.closesAt)}
                            </span>
                          </div>
                        )}
                        {selectedProposal.yourVote !== "didntVote" && (
                          <div className="flex justify-between py-1 border-b">
                            <span>Ваш глас</span>
                            <div className="flex items-center gap-1">
                              <VoteIcon vote={selectedProposal.yourVote} />
                              <span>
                                {selectedProposal.yourVote === "for" && "За"}
                                {selectedProposal.yourVote === "against" &&
                                  "Против"}
                                {selectedProposal.yourVote === "abstain" &&
                                  "Уздржан"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Glasovi fakulteta ako je korisnik glasao ili je glasanje završeno */}
                    {(selectedProposal.yourVote ||
                      isVotingComplete(selectedProposal)) && (
                      <div>
                        <h3 className="font-medium mb-2">Гласови факултета</h3>
                        <div className="bg-muted p-2 rounded-md space-y-1 max-h-48 overflow-y-auto">
                          {Object.entries(selectedProposal.votesForAddress).map(
                            ([voterAddress, vote]) => (
                              <div
                                key={voterAddress}
                                className="flex justify-between items-center py-1 px-2 text-xs bg-background rounded-sm"
                              >
                                <span>
                                  {convertAddressToName(voterAddress)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <VoteIcon vote={vote} />
                                  {/* 
                                  TODO: Add time when a vote is recorded, should be possible to extract from events on the chain
                                  <span className="text-muted-foreground text-xs">
                                    {formatDate(vote.timestamp)}
                                  </span> */}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Гласање</CardTitle>
                      <CardDescription>
                        {selectedProposal.yourVote !== "didntVote"
                          ? "Већ сте гласали за овај предлог"
                          : isVotingComplete(selectedProposal)
                            ? "Време за гласање је истекло"
                            : "Одаберите ваш глас за овај предлог"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedProposal.yourVote !== "didntVote" ? (
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-600 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>
                              Успешно сте гласали{" "}
                              <span className="font-medium">
                                {selectedProposal.yourVote === "for" && "ЗА"}
                                {selectedProposal.yourVote === "against" &&
                                  "ПРОТИВ"}
                                {selectedProposal.yourVote === "abstain" &&
                                  "УЗДРЖАН"}
                              </span>
                            </span>
                          </div>

                          <div>
                            {/* 
                            TODO: Show something here or sack
                            <h3 className="text-sm font-medium mb-2">
                              Ваша потврда трансакције
                            </h3>
                            <div className="bg-muted p-3 rounded-md text-xs font-mono break-all">
                              0x7f9a12e4b9a3b5c8d6e7f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1
                            </div> */}
                            <div className="mt-2 text-xs text-muted-foreground">
                              Ваш глас је забележен у блокчејну и не може бити
                              измењен.
                            </div>
                          </div>

                          {isVotingComplete(selectedProposal) ? (
                            <Button asChild className="w-full">
                              <Link
                                href={`/votes/${selectedProposal.id}/results`}
                              >
                                Погледај резултате
                              </Link>
                            </Button>
                          ) : (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
                              <div className="flex items-start gap-2">
                                <Lock className="h-4 w-4 text-blue-500 mt-0.5" />
                                <div>
                                  <h3 className="font-medium text-blue-800">
                                    Резултати ће бити доступни након гласања
                                  </h3>
                                  <p className="text-sm text-blue-700 mt-1">
                                    {isQuorumReached(selectedProposal)
                                      ? `Резултати ће бити доступни за ${getRemainingTime(selectedProposal.closesAt)}.`
                                      : "Резултати ће бити доступни након достизања кворума и истека периода гласања."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : isVotingComplete(selectedProposal) ? (
                        <div className="space-y-4">
                          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-gray-500" />
                            <span>Време за гласање је истекло</span>
                          </div>

                          {isVotingComplete(selectedProposal) && (
                            <Button asChild className="w-full">
                              <Link
                                href={`/votes/${selectedProposal.id}/results`}
                              >
                                Погледај резултате
                              </Link>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              variant={
                                selectedVote === "for" ? "default" : "outline"
                              }
                              className={
                                selectedVote === "for"
                                  ? "bg-green-500 hover:bg-green-600"
                                  : ""
                              }
                              onClick={() => handleVote("for")}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              За
                            </Button>
                            <Button
                              variant={
                                selectedVote === "against"
                                  ? "default"
                                  : "outline"
                              }
                              className={
                                selectedVote === "against"
                                  ? "bg-red-500 hover:bg-red-600"
                                  : ""
                              }
                              onClick={() => handleVote("against")}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Против
                            </Button>
                            <Button
                              variant={
                                selectedVote === "abstain"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => handleVote("abstain")}
                            >
                              <MinusCircle className="mr-1 h-4 w-4" />
                              Уздржан
                            </Button>
                          </div>

                          {selectedVote ? (
                            voteSubmitted ? (
                              <div className="space-y-4">
                                {voteRegistered ? (
                                  <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-600 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Глас успешно забележен!</span>
                                  </div>
                                ) : (
                                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-600">
                                    <div className="text-center mb-2">
                                      Потврђивање гласа...
                                    </div>
                                    <div className="flex justify-center items-center">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    </div>
                                    <div className="text-xs text-center mt-2">
                                      Сачекајте док се глас потврди на блокчејну
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Button
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={handleSubmitVote}
                              >
                                Потврди глас
                              </Button>
                            )
                          ) : (
                            <p className="text-xs text-muted-foreground text-center">
                              Одаберите једну од опција изнад да бисте гласали
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Rezultati glasanja */}
                  {isVotingComplete(selectedProposal) && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Резултати гласања</CardTitle>
                        <CardDescription>
                          Гласање је завршено{" "}
                          {formatDate(selectedProposal.closesAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <VoteCounter proposal={selectedProposal} />
                      </CardContent>
                    </Card>
                  )}

                  {data.quorum.reached &&
                    !isVotingComplete(data) &&
                    data.expiresAt && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Статус кворума</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Кворум достигнут</span>
                              <Badge className="bg-green-500">
                                {data.quorum.current}/{data.quorum.required}
                              </Badge>
                            </div>
                            {data.quorum.reachedAt && (
                              <div className="flex justify-between py-1 border-b">
                                <span className="text-sm">
                                  Време достизања кворума
                                </span>
                                <span className="text-sm font-medium">
                                  {formatDate(data.quorum.reachedAt)}
                                </span>
                              </div>
                            )}
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                              <div className="flex items-start gap-2">
                                <Timer className="h-4 w-4 text-amber-500 mt-0.5" />
                                <div>
                                  <p className="text-sm text-amber-700">
                                    Гласање ће бити затворено за{" "}
                                    {getRemainingTime(data.expiresAt)} или када
                                    сви факултети гласају.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </div>
              </div>

              {/* Blockchain transakcije */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">
                  Блокчејн трансакције
                </h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Трансакције на блокчејну</CardTitle>
                    <CardDescription>
                      Све трансакције везане за овај предлог су трајно
                      забележене на Ethereum блокчејну
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex flex-col p-3 border rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium">
                            Креирање предлога
                          </div>
                          <Badge variant="outline">Успешно</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(data.dateAdded)}
                        </div>
                        <div className="flex items-center text-xs mt-2">
                          <span className="mr-1 text-muted-foreground">
                            Хеш:
                          </span>
                          <span className="font-mono">
                            0x8f721a5d7cd53d0eb3d1c97...
                          </span>
                        </div>
                      </div>

                      {/* Glasovi na blockchainu */}
                      {data.votes &&
                        data.votes.length > 0 &&
                        data.votes.slice(0, 3).map((vote, i) => (
                          <div
                            key={i}
                            className="flex flex-col p-3 border rounded-md"
                          >
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-medium">
                                Глас: {vote.faculty}
                              </div>
                              <Badge variant="outline">Успешно</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDate(vote.timestamp)}
                            </div>
                            <div className="flex items-center text-xs mt-2">
                              <span className="mr-1 text-muted-foreground">
                                Хеш:
                              </span>
                              <span className="font-mono">
                                {vote.walletAddress}
                              </span>
                            </div>
                          </div>
                        ))}

                      {/* Ostali glasovi link */}
                      {data.votes && data.votes.length > 3 && (
                        <div className="text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                          Прикажи још {data.votes.length - 3} трансакција
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="border-t py-6 w-full">
        <div className="w-full max-w-full flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} eVSD. Sva prava zadržana.
          </p>
        </div>
      </footer>
    </div>
  );
}
