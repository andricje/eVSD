"use client";
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Search, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { Header } from "@/components/header";
import {
  clipAddress,
  formatDate,
  isVotingComplete,
  usersFromAddressNameMapRecord,
} from "@/lib/utils";
import { useProposals } from "@/hooks/use-proposals";
import { StatusBadge } from "@/components/badges";
import { ProposalInfo } from "@/components/ProposalInfo/proposal-info";
import { useWallet } from "@/context/wallet-context";
import { useRouter } from "next/navigation";
import { Proposal, User } from "@/types/proposal";
import { addressNameMap } from "@/constants/address-name-map";
import { Badge } from "@/components/ui/badge";

function FilterResults({
  filteredProposals,
  usersToFollow,
}: {
  filteredProposals: Proposal[];
  usersToFollow: User[];
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
                      <span className="hidden sm:inline sm:px-1">|</span>
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

              <ProposalInfo proposal={proposal} usersToFollow={usersToFollow} />
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

// ComboBox za pretragu korisnika
function UsersCombobox({
  onSelectAuthor,
  onAddUserToFollow,
  isAuthorComboBox = false,
}: {
  onSelectAuthor?: React.Dispatch<React.SetStateAction<User | null>>;
  onAddUserToFollow?: (user: User) => void;
  isAuthorComboBox?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);

  const handleSelect = (user: User | null) => {
    if (isAuthorComboBox) {
      setSelected(user);
      onSelectAuthor?.(user);
    } else {
      if (user) {
        onAddUserToFollow?.(user);
      }
    }
    setOpen(false);
  };

  const users = useMemo(
    () => usersFromAddressNameMapRecord(addressNameMap),
    []
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={`w-full ${isAuthorComboBox ? "sm:w-[180px]" : "sm:w-[260px]"}`}
        >
          <div className="flex w-full items-center gap-2 -ml-2">
            <UserIcon className="h-4 w-4" />
            {isAuthorComboBox ? (
              selected ? (
                <span className="flex items-center gap-2">{selected.name}</span>
              ) : (
                "Aутор"
              )
            ) : (
              "Прикажи гласове корисника"
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Претражите кориснике..." />
          <CommandList>
            <CommandEmpty>Нема резултата.</CommandEmpty>
            {isAuthorComboBox && (
              <CommandItem
                value=""
                onSelect={() => handleSelect(null)}
                className="cursor-pointer"
              >
                <span className="font-semibold">Сви</span>
              </CommandItem>
            )}
            {users?.map((user) => (
              <CommandItem
                key={user.address}
                value={user.name}
                onSelect={() => handleSelect(user)}
                className="cursor-pointer"
              >
                <span className="font-semibold">{user.name}</span>
                {clipAddress(user.address)}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function RezultatiPage() {
  const { proposals } = useProposals();
  const { user } = useWallet();
  const router = useRouter();
  if (!user) {
    router.push("/login");
  }
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [filterAuthor, setFilterAuthor] = useState<User | null>(null);
  const [usersToFollow, setUsersToFollow] = useState<User[]>([]);

  const handleAddUserToFollow = (user: User) => {
    if (!usersToFollow.some((u) => u.address === user.address)) {
      setUsersToFollow((prev) => [...prev, user]);
    }
  };

  // Sortiranje predloga hronološki - najnoviji na vrhu
  const sortedProposals = [...proposals].sort((a, b) => {
    return b.dateAdded.getTime() - a.dateAdded.getTime();
  });

  // Филтрирање предлога
  const filteredProposals = sortedProposals.filter((proposal) => {
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

    let matchesAuthor = true;

    if (filterAuthor) {
      matchesAuthor = proposal.author.address === filterAuthor.address;
    }

    let matchesUsersToFollow = true;

    if (usersToFollow?.length > 0) {
      matchesUsersToFollow = usersToFollow.some((user) =>
        proposal.voteItems.some((voteItem) =>
          voteItem.userVotes.has(user.address)
        )
      );
    }

    return (
      matchesSearch && matchesDate && matchesAuthor && matchesUsersToFollow
    );
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full max-w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
            <h1 className="text-3xl font-bold flex-shrink-0">
              Објављени резултати гласања
            </h1>
            <div className="flex flex-col gap-2 w-full sm:w-[450px] 2xl:w-auto">
              <div className="flex flex-col 2xl:flex-row gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Претрага предлога..."
                      className="pl-8 w-full sm:w-[260px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterDate} onValueChange={setFilterDate}>
                    <SelectTrigger className="w-full md:w-[180px] min-w-[150px] sm:max-w-[300px]">
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full 2xl:w-[448px]">
                  <div className="order-2 sm:order-1 2xl:order-2">
                    <UsersCombobox
                      isAuthorComboBox={false}
                      onAddUserToFollow={handleAddUserToFollow}
                    />
                  </div>
                  <div className="order-1 sm:order-2 2xl:order-1">
                    <UsersCombobox
                      onSelectAuthor={setFilterAuthor}
                      isAuthorComboBox={true}
                    />
                  </div>
                </div>
              </div>
              {usersToFollow?.length > 0 && (
                <div className="flex flex-col items-start lg:items-end gap-1 max-w-[440px] xl:max-w-full">
                  <h4 className="text-sm text-gray-500">
                    Корисници чије гласове пратите
                  </h4>
                  <div className="flex flex-row flex-wrap lg:justify-end w-full gap-2 max-w-[440px] xl:max-w-full">
                    {usersToFollow.map((user) => (
                      <Badge
                        variant="outline"
                        key={user.address}
                        onClick={() =>
                          setUsersToFollow((prev) =>
                            prev.filter((u) => u.address !== user.address)
                          )
                        }
                        className="cursor-pointer"
                      >
                        {user.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            <FilterResults
              filteredProposals={filteredProposals}
              usersToFollow={usersToFollow}
            />
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
