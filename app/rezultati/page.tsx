"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/header";
import {
  convertAddressToName,
  countTotalVotes,
  formatDate,
  isQuorumReached,
  isVotingComplete,
  QUORUM,
} from "@/lib/utils";
import { useProposals } from "@/hooks/use-proposals";
import { StatusBadge } from "@/components/badges";

export default function RezultatiPage() {
  const { proposals } = useProposals();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [expandedProposal, setExpandedProposal] = useState<bigint | null>(null);

  // Филтрирање предлога
  const filteredProposals = proposals.filter((proposal) => {
    // Претрага по наслову или опису
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.author.toLowerCase().includes(searchTerm.toLowerCase());

    // Филтер по датуму
    let matchesDate = true;

    if (filterDate === "month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      matchesDate = proposal.closesAt > oneMonthAgo;
    } else if (filterDate === "quarter") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      matchesDate = proposal.closesAt > threeMonthsAgo;
    } else if (filterDate === "year") {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      matchesDate = proposal.closesAt > oneYearAgo;
    }

    return matchesSearch && matchesDate;
  });

  // Vote badge
  const VoteBadge = ({ vote }: { vote: string }) => {
    if (vote === "for") {
      return <Badge className="bg-green-500">За</Badge>;
    } else if (vote === "against") {
      return <Badge className="bg-red-500">Против</Badge>;
    } else {
      return <Badge variant="outline">Уздржан</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full max-w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-3xl font-bold">Објављени резултати гласања</h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Претрага предлога..."
                  className="pl-8 w-full md:w-[260px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <SelectValue placeholder="Филтер по датуму" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Све време</SelectItem>
                  <SelectItem value="month">Последњи месец</SelectItem>
                  <SelectItem value="quarter">Последња 3 месеца</SelectItem>
                  <SelectItem value="year">Последња година</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6">
            {filteredProposals.length > 0 ? (
              filteredProposals.map((proposal) => (
                <Card key={proposal.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div>
                        <CardTitle className="text-xl">
                          {proposal.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Предложио: {proposal.author}
                          {isVotingComplete(proposal) &&
                            `| Гласање завршено: ${formatDate(proposal.closesAt)}`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{proposal.description}</p>

                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-4">
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Резултат гласања
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <Badge className="bg-green-500">За</Badge>
                            <span className="ml-1">{proposal.votesFor}</span>
                          </div>
                          <div className="flex items-center">
                            <Badge className="bg-red-500">Против</Badge>
                            <span className="ml-1">
                              {proposal.votesAgainst}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">Уздржан</Badge>
                            <span className="ml-1">
                              {proposal.votesAbstain}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Кворум</p>
                        <div className="flex items-center">
                          <span>
                            {countTotalVotes(proposal)}/{QUORUM}
                          </span>
                          {isQuorumReached(proposal) && (
                            <Badge className="bg-green-500 ml-2">
                              Достигнут
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Статус</p>
                        <StatusBadge
                          status={proposal.status}
                          expiresAt={proposal.closesAt}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedProposal(
                            expandedProposal === proposal.id
                              ? null
                              : proposal.id
                          )
                        }
                      >
                        {expandedProposal === proposal.id
                          ? "Сакриј детаље"
                          : "Прикажи детаље гласања"}
                      </Button>

                      {expandedProposal === proposal.id && (
                        <div className="mt-4 border rounded-md p-4">
                          <h3 className="text-sm font-medium mb-2">
                            Детаљи гласања по факултетима
                          </h3>
                          <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                            {Object.entries(proposal.votesForAddress).map(
                              ([address, vote]) => (
                                <div
                                  key={address}
                                  className="flex justify-between py-1 border-b text-sm"
                                >
                                  <span>{convertAddressToName(address)}</span>
                                  <VoteBadge vote={vote} />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  Нема резултата за приказ
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Покушајте да измените филтере или претрагу да бисте видели
                  резултате
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="border-t py-6 w-full">
        <div className="w-full max-w-full flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} еВСД. Сва права задржана.
          </p>
        </div>
      </footer>
    </div>
  );
}
