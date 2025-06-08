"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/header";
import { formatDate, isVotingComplete } from "@/lib/utils";
import { useProposals } from "@/hooks/use-proposals";
import { StatusBadge } from "@/components/badges";
import { ProposalInfo } from "@/components/ProposalInfo/proposal-info";
import { useWallet } from "@/context/wallet-context";
import { useRouter } from "next/navigation";
import { Proposal } from "@/types/proposal";

/**
 * Displays a list of proposal cards based on the provided filtered proposals.
 *
 * If the list is empty, shows a message indicating no results were found and suggests adjusting filters or search criteria.
 *
 * @param filteredProposals - The proposals to display.
 */
function FilterResults({
  filteredProposals,
}: {
  filteredProposals: Proposal[];
}) {
  return (
    <>
      {filteredProposals.length > 0 ? (
        filteredProposals.map((proposal) => (
          <Card key={proposal.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-col">
                <CardTitle className="sm:w-full">
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <p className="flex-grow text-xl">{proposal.title}</p>
                    <div>
                      <StatusBadge
                        status={proposal.status}
                        expiresAt={proposal.closesAt}
                      />
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="mt-1 sm:mt-2">
                  <div className="flex flex-col sm:flex-row">
                    <div>Предложио: {proposal.author.name} </div>
                    <div>
                      {isVotingComplete(proposal) && (
                        <span className="hidden sm:inline sm:px-1">|</span>
                      )}
                      {isVotingComplete(proposal) &&
                        `Гласање завршено: ${formatDate(proposal.closesAt)}`}
                    </div>
                  </div>
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm mb-4">{proposal.description}</p>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-4">
                <div>
                  <p className="text-sm font-medium mb-1">Резултат гласања:</p>
                </div>
              </div>

              <ProposalInfo proposal={proposal} />
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            Нема резултата за приказ
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Покушајте да измените филтере или претрагу да бисте видели резултате
          </p>
        </div>
      )}
    </>
  );
}

/**
 * Displays the voting results page with filtering and search for proposals.
 *
 * Redirects unauthenticated users to the login page. Allows users to search proposals by title, description, or author, and filter them by closing date range. Shows proposals sorted by most recently added.
 */
export default function RezultatiPage() {
  const { proposals } = useProposals();
  const { user } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("all");

  // Филтрирање предлога
  const filteredProposals = proposals
    .filter((proposal) => {
      // Претрага по наслову или опису
      const matchesSearch =
        proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.author.name.toLowerCase().includes(searchTerm.toLowerCase());

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
    })
    // Сортирање по датуму додавања
    .sort((a, b) => {
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full max-w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center lg:justify-between gap-4">
            <h1 className="text-3xl w-full font-bold flex-shrink-0 md:max-w-[50%]">
              Објављени резултати гласања
            </h1>
            <div className="flex items-center gap-2 min-w-[300px]">
              <div className="relative min-w-[200px]">
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
                <SelectTrigger className="w-full md:w-[180px] min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <SelectValue placeholder="Филтер по датуму" />
                  </div>
                </SelectTrigger>
                <SelectContent className="w-full min-w-[150px]">
                  <SelectItem value="all">Све време</SelectItem>
                  <SelectItem value="month">Последњи месец</SelectItem>
                  <SelectItem value="quarter">Последња 3 месеца</SelectItem>
                  <SelectItem value="year">Последња година</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6">
            <FilterResults filteredProposals={filteredProposals} />
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
