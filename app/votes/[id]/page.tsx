"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  LogOut,
  Calendar,
  ChevronLeft,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertCircle,
  Timer,
  Wallet,
  Lock,
  AlertTriangle,
} from "lucide-react"
import { useWallet } from "@/context/wallet-context"
import { VoteSignature } from "@/components/vote-signature"
import { WalletInfo } from "@/components/wallet-info"

// Dodavanje funkcije za računanje preostalog vremena
const getRemainingTime = (expiresAt: string) => {
  const now = new Date()
  const expiration = new Date(expiresAt)
  const diffMs = expiration.getTime() - now.getTime()

  if (diffMs <= 0) return "Isteklo"

  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return `${diffHrs}h ${diffMins}m`
}

// Funkcija za proveru da li je vreme za glasanje isteklo
const hasVotingTimeExpired = (proposal: any) => {
  if (!proposal.expiresAt) return false

  const now = new Date()
  const expirationDate = new Date(proposal.expiresAt)

  return now > expirationDate
}

// Funkcija koja proverava da li je period čekanja od 48h prošao nakon dostizanja kvoruma
const hasWaitingPeriodPassed = (proposal: any) => {
  if (!proposal.quorum.reached || !proposal.expiresAt) return false

  const now = new Date()
  const expirationDate = new Date(proposal.expiresAt)

  // Provera da li je trenutno vreme prošlo datum isteka (48 sati nakon kvoruma)
  return now > expirationDate
}

// Funkcija koja proverava da li je glasanje završeno
const isVotingComplete = (proposal: any) => {
  return proposal.status === "closed" || proposal.status === "expired" || hasWaitingPeriodPassed(proposal)
}

// Simulirani podaci za zatvoreni predlog
const proposalData = {
  id: 1,
  title: "Usvajanje budžeta za 2025. godinu",
  dateAdded: "2025-04-05T10:00:00",
  description: "Glasanje o predlogu budžeta VSD za 2025. godinu",
  author: "Ekonomski fakultet",
  urgent: false,
  result: {
    for: 15,
    against: 3,
    abstain: 2,
  },
  yourVote: "for",
  quorum: {
    required: 10,
    current: 20,
    reached: true,
  },
  status: "closed", // zatvoren predlog
  closedAt: "2025-04-07T15:30:00",
  allVoted: true,
  votes: [
    {
      faculty: "Fakultet tehničkih nauka",
      vote: "for",
      timestamp: "2025-04-05T10:32:15",
      walletAddress: "0x1234...7890",
    },
    { faculty: "Pravni fakultet", vote: "for", timestamp: "2025-04-05T10:32:45", walletAddress: "0x2345...8901" },
    // ... ostali glasovi
  ],
}

// Simulirani podaci za aktivno glasanje
const activeProposalData = {
  id: 3,
  title: "Izbor novog predsednika VSD",
  dateAdded: "2025-04-10T14:00:00",
  description: "Glasanje za novog predsednika VSD za mandatni period 2025-2026",
  author: "Fakultet tehničkih nauka",
  urgent: true,
  result: {
    for: 6,
    against: 1,
    abstain: 1,
  },
  quorum: {
    required: 12,
    current: 15,
    reached: true,
    reachedAt: "2025-04-11T14:00:00", // Dodato vreme kada je kvorum dostignut
  },
  status: "expiring", // kvorum dostignut, ističe uskoro
  expiresAt: "2025-04-12T14:00:00", // 48h nakon dostizanja kvoruma
  allVoted: false,
  votes: [
    {
      faculty: "Fakultet tehničkih nauka",
      vote: "for",
      timestamp: "2025-04-15T14:05:15",
      walletAddress: "0x1234...7890",
    },
    // ... ostali glasovi
  ],
}

// Simulirani podaci za predlog sa isteklim vremenom za glasanje
const expiredProposalData = {
  id: 9,
  title: "Predlog za organizaciju studentske konferencije",
  dateAdded: "2025-04-01T08:00:00",
  description: "Glasanje o predlogu za organizaciju međunarodne studentske konferencije",
  author: "Fakultet organizacionih nauka",
  urgent: false,
  result: {
    for: 12,
    against: 0,
    abstain: 0,
  },
  quorum: {
    required: 10,
    current: 12,
    reached: true,
    reachedAt: "2025-04-02T10:30:00", // Dodato vreme kada je kvorum dostignut
  },
  status: "expired", // kvorum dostignut, vreme isteklo
  expiresAt: "2025-04-03T08:00:00", // 48h nakon dostizanja kvoruma (već isteklo)
  allVoted: false,
  votes: [
    {
      faculty: "Fakultet tehničkih nauka",
      vote: "for",
      timestamp: "2025-04-01T09:15:20",
      walletAddress: "0x1234...7890",
    },
    // ... ostali glasovi
  ],
}

// Simulirani podaci za predlog gde korisnik NIJE glasao i kvorum NIJE dostignut
const activeNoQuorumProposalData = {
  id: 4,
  title: "Izmene pravilnika o studentskim domovima",
  dateAdded: "2025-04-12T09:30:00",
  description: "Predlog izmena pravilnika o studentskim domovima koji će omogućiti bolje uslove za studente tokom boravka u domovima. Detaljne izmene se odnose na pravila o korišćenju zajedničkih prostorija, organizacije događaja i pravila o kućnom redu.",
  author: "Fakultet sporta i fizičkog vaspitanja",
  urgent: false,
  result: {
    for: 3,
    against: 1,
    abstain: 1,
  },
  quorum: {
    required: 12,
    current: 5,
    reached: false,
  },
  status: "active", // aktivan predlog
  allVoted: false,
  votes: [
    {
      faculty: "Fakultet tehničkih nauka",
      vote: "for",
      timestamp: "2025-04-12T10:15:20",
      walletAddress: "0x1234...7890",
    },
    { faculty: "Pravni fakultet", vote: "against", timestamp: "2025-04-12T11:30:45", walletAddress: "0x2345...8901" },
    { faculty: "Ekonomski fakultet", vote: "for", timestamp: "2025-04-12T12:45:10", walletAddress: "0x3456...9012" },
    { faculty: "Medicinski fakultet", vote: "for", timestamp: "2025-04-12T13:20:30", walletAddress: "0x4567...0123" },
    { faculty: "Filozofski fakultet", vote: "abstain", timestamp: "2025-04-12T14:10:15", walletAddress: "0x5678...1234" },
  ],
}

// Simulirani podaci za predlog gde je korisnik glasao, ali kvorum NIJE dostignut
const userVotedNoQuorumProposalData = {
  id: 5,
  title: "Usvajanje izveštaja o radu za 2024. godinu",
  dateAdded: "2025-04-05T10:00:00",
  description: "Glasanje o izveštaju o radu VSD za 2024. godinu sa svim sprovedenim aktivnostima, organizovanim događajima i ostvarenim rezultatima za prethodnu godinu.",
  author: "Medicinski fakultet",
  urgent: false,
  result: {
    for: 4,
    against: 2,
    abstain: 1,
  },
  quorum: {
    required: 10,
    current: 7,
    reached: false,
  },
  status: "active", // aktivan predlog
  allVoted: false,
  yourVote: "for", // Korisnik je već glasao za ovaj predlog
  votes: [
    {
      faculty: "Fakultet tehničkih nauka",
      vote: "for",
      timestamp: "2025-04-05T10:30:20",
      walletAddress: "0x1234...7890",
    },
    { faculty: "Pravni fakultet", vote: "abstain", timestamp: "2025-04-05T11:00:45", walletAddress: "0x2345...8901" },
    { faculty: "Ekonomski fakultet", vote: "for", timestamp: "2025-04-05T11:30:10", walletAddress: "0x3456...9012" },
    { faculty: "Medicinski fakultet", vote: "for", timestamp: "2025-04-05T12:15:30", walletAddress: "0x4567...0123" },
    { faculty: "Filozofski fakultet", vote: "against", timestamp: "2025-04-05T12:45:15", walletAddress: "0x5678...1234" },
    { faculty: "Fakultet sporta i fizičkog vaspitanja", vote: "against", timestamp: "2025-04-05T13:20:40", walletAddress: "0x6789...2345" },
    { faculty: "Građevinski fakultet", vote: "for", timestamp: "2025-04-05T14:00:10", walletAddress: "0x7890...3456" },
  ],
}

// Simulirani podaci za predlog gde je korisnik glasao i kvorum JE dostignut
const userVotedQuorumReachedProposalData = {
  id: 6,
  title: "Predlog za izmenu statuta studentskih organizacija",
  dateAdded: "2025-04-05T10:00:00",
  description: "Predlog za izmenu statuta studentskih organizacija koji će omogućiti više autonomije studentskim predstavnicima i olakšati organizaciju događaja od značaja za studentsku populaciju.",
  author: "Filozofski fakultet",
  urgent: false,
  result: {
    for: 10,
    against: 1,
    abstain: 1,
  },
  quorum: {
    required: 10,
    current: 12,
    reached: true,
    reachedAt: "2025-04-06T10:00:00", // Dodato vreme kada je kvorum dostignut
  },
  status: "expiring", // kvorum dostignut, ističe uskoro
  expiresAt: "2025-04-07T10:00:00", // 48h nakon dostizanja kvoruma
  allVoted: false,
  yourVote: "for", // Korisnik je već glasao za ovaj predlog
  votes: [
    {
      faculty: "Fakultet tehničkih nauka",
      vote: "for",
      timestamp: "2025-04-05T10:20:00",
      walletAddress: "0x1234...7890",
    },
    { faculty: "Pravni fakultet", vote: "for", timestamp: "2025-04-05T10:40:30", walletAddress: "0x2345...8901" },
    { faculty: "Ekonomski fakultet", vote: "for", timestamp: "2025-04-05T11:10:40", walletAddress: "0x3456...9012" },
    { faculty: "Medicinski fakultet", vote: "for", timestamp: "2025-04-05T11:45:15", walletAddress: "0x4567...0123" },
    { faculty: "Filozofski fakultet", vote: "for", timestamp: "2025-04-05T12:20:50", walletAddress: "0x5678...1234" },
    { faculty: "Fakultet sporta i fizičkog vaspitanja", vote: "abstain", timestamp: "2025-04-05T13:00:20", walletAddress: "0x6789...2345" },
    { faculty: "Građevinski fakultet", vote: "against", timestamp: "2025-04-05T13:30:05", walletAddress: "0x7890...3456" },
    { faculty: "Elektrotehnički fakultet", vote: "for", timestamp: "2025-04-05T14:00:45", walletAddress: "0x8901...4567" },
    { faculty: "Mašinski fakultet", vote: "for", timestamp: "2025-04-05T14:30:20", walletAddress: "0x9012...5678" },
    { faculty: "Tehnološki fakultet", vote: "for", timestamp: "2025-04-05T15:00:10", walletAddress: "0x0123...6789" },
    { faculty: "Fakultet organizacionih nauka", vote: "for", timestamp: "2025-04-05T15:30:30", walletAddress: "0x1234...7890" },
    { faculty: "Fakultet političkih nauka", vote: "for", timestamp: "2025-04-05T16:00:15", walletAddress: "0x2345...8901" },
  ],
}

// Simulirani podaci za hitno glasanje gde korisnik NIJE glasao i kvorum JE dostignut
const urgentQuorumReachedNoVoteProposalData = {
  id: 7,
  title: "Hitno glasanje o studentskom protestu",
  dateAdded: "2025-04-10T14:00:00",
  description: "Hitno glasanje o organizovanom studentskom protestu povodom novog pravilnika o školarinama koji bi trebao biti usvojen sledeće nedelje.",
  author: "Fakultet političkih nauka",
  urgent: true,
  result: {
    for: 6,
    against: 1,
    abstain: 1,
  },
  quorum: {
    required: 8,
    current: 8,
    reached: true,
    reachedAt: "2025-04-11T10:00:00", // Dodato vreme kada je kvorum dostignut
  },
  status: "expiring", // kvorum dostignut, ističe uskoro
  expiresAt: "2025-04-12T14:00:00", // 48h nakon dostizanja kvoruma
  allVoted: false,
  votes: [
    {
      faculty: "Fakultet tehničkih nauka",
      vote: "for",
      timestamp: "2025-04-10T14:30:15",
      walletAddress: "0x1234...7890",
    },
    { faculty: "Pravni fakultet", vote: "for", timestamp: "2025-04-10T15:00:45", walletAddress: "0x2345...8901" },
    { faculty: "Ekonomski fakultet", vote: "abstain", timestamp: "2025-04-10T15:30:10", walletAddress: "0x3456...9012" },
    { faculty: "Medicinski fakultet", vote: "for", timestamp: "2025-04-10T16:00:30", walletAddress: "0x4567...0123" },
    { faculty: "Filozofski fakultet", vote: "for", timestamp: "2025-04-10T16:30:15", walletAddress: "0x5678...1234" },
    { faculty: "Fakultet političkih nauka", vote: "for", timestamp: "2025-04-10T17:00:40", walletAddress: "0x6789...2345" },
    { faculty: "Fakultet organizacionih nauka", vote: "for", timestamp: "2025-04-10T17:30:10", walletAddress: "0x7890...3456" },
    { faculty: "Elektrotehnički fakultet", vote: "against", timestamp: "2025-04-10T18:00:15", walletAddress: "0x8901...4567" },
  ],
}

export default function VoteDetailPage() {
  const params = useParams()
  const voteId = params.id
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [voteSubmitted, setVoteSubmitted] = useState(false)
  const [signatureComplete, setSignatureComplete] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const { wallet, authorizedWallet } = useWallet()

  // Odabir podataka na osnovu ID-a (u pravoj implementaciji bi se podaci učitavali sa servera)
  let data
  if (voteId === "1") {
    data = proposalData;  // Zatvoreno glasanje (vi ste glasali)
  } else if (voteId === "3") {
    data = activeProposalData;  // Aktivno glasanje sa kvorumom (hitno)
  } else if (voteId === "4") {
    data = activeNoQuorumProposalData;  // Aktivno glasanje bez kvoruma
  } else if (voteId === "5") {
    data = userVotedNoQuorumProposalData;  // Aktivno glasanje gde ste vi već glasali, ali kvorum nije dostignut
  } else if (voteId === "6") {
    data = userVotedQuorumReachedProposalData;  // Glasanje gde ste glasali i kvorum je dostignut
  } else if (voteId === "7") {
    data = urgentQuorumReachedNoVoteProposalData;  // Hitno glasanje gde niste glasali, ali kvorum je dostignut 
  } else if (voteId === "9") {
    data = expiredProposalData;  // Isteklo glasanje (niste glasali)
  } else {
    data = proposalData;  // Default
  }

  // Formatiranje datuma
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("sr-RS", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Vote badge
  const VoteBadge = ({ vote }: { vote: string }) => {
    if (vote === "for") {
      return <Badge className="bg-green-500">Za</Badge>
    } else if (vote === "against") {
      return <Badge className="bg-red-500">Protiv</Badge>
    } else {
      return <Badge variant="outline">Uzdržan</Badge>
    }
  }

  // Vote icon
  const VoteIcon = ({ vote }: { vote: string }) => {
    if (vote === "for") {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    } else if (vote === "against") {
      return <XCircle className="h-4 w-4 text-red-500" />
    } else {
      return <MinusCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Status badge
  const StatusBadge = ({ status, expiresAt, urgent }: { status: string; expiresAt?: string; urgent?: boolean }) => {
    if (urgent) {
      return <Badge className="bg-red-500">Hitno</Badge>
    }

    if (status === "closed") {
      return <Badge className="bg-green-500">Zatvoreno</Badge>
    } else if (status === "expired" || (status === "expiring" && hasVotingTimeExpired(data))) {
      return <Badge className="bg-gray-500">Isteklo</Badge>
    } else if (status === "expiring" && expiresAt) {
      return (
        <Badge className="bg-amber-500">
          <Timer className="h-3 w-3 mr-1" />
          Ističe za {getRemainingTime(expiresAt)}
        </Badge>
      )
    } else {
      return <Badge className="bg-blue-500">Aktivno</Badge>
    }
  }

  const handleVote = (vote: string) => {
    setSelectedVote(vote)
  }

  // Dodajemo funkciju za potvrđivanje glasa
  const handleSubmitVote = () => {
    if (selectedVote) {
      setVoteSubmitted(true)
    }
  }

  const handleSignatureComplete = (sig: string) => {
    setSignature(sig)
    setSignatureComplete(true)

    // Simulacija slanja glasa na server
    setTimeout(() => {
      setVoteSubmitted(true)
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 2000)
    }, 1000)
  }

  // Provera da li je glasanje završeno
  const votingComplete = isVotingComplete(data)

  // Provera da li je vreme za glasanje isteklo
  const votingTimeExpired = hasVotingTimeExpired(data)

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b w-full">
        <div className="w-full max-w-full flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-semibold">
            <Wallet className="h-6 w-6" />
            <span>eVSD</span>
          </div>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/dashboard" className="text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/rezultati" className="text-sm font-medium">
              Javni rezultati
            </Link>
            <Link href="/login" className="text-sm font-medium text-red-500">
              <LogOut className="h-4 w-4 inline mr-1" />
              Odjava
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Povratak na Dashboard
          </Link>
          
          {wallet && authorizedWallet && <WalletInfo />}

          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold">{data.title}</h1>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-4 w-4" />
                  Dodato: {formatDate(data.dateAdded)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={data.status} expiresAt={data.expiresAt} urgent={data.urgent} />
                {!isVotingComplete(data) && data.quorum.reached && (
                  <Badge variant="outline" className="border-amber-500 text-amber-500">
                    <Timer className="h-3 w-3 mr-1" />
                    Završava se za {getRemainingTime(data.expiresAt)}
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
                    <p className="text-sm">{data.description}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Информације</h3>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between py-1 border-b">
                        <span>Предлагач</span>
                        <span className="font-medium">{data.author}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span>Статус кворума</span>
                        <span className={`font-medium ${data.quorum.reached ? "text-green-600" : "text-amber-600"}`}>
                          {data.quorum.reached ? "Достигнут" : "Није достигнут"}
                          {!data.quorum.reached && ` (потребно још ${data.quorum.required - data.quorum.current})`}
                        </span>
                      </div>
                      {data.quorum.reached && data.quorum.reachedAt && (
                        <div className="flex justify-between py-1 border-b">
                          <span>Кворум достигнут</span>
                          <span className="font-medium text-green-600">
                            {formatDate(data.quorum.reachedAt)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-1 border-b">
                        <span>Статус гласања</span>
                        <span className="font-medium">
                          {data.status === "closed" && "Затворено"}
                          {data.status === "expired" && "Истекло"}
                          {data.status === "expiring" && data.expiresAt && (
                            <span className="text-amber-600">
                              Истиче за {getRemainingTime(data.expiresAt)}
                            </span>
                          )}
                          {data.status === "active" && "Активно"}
                        </span>
                      </div>
                      {data.quorum.reached && !data.allVoted && !isVotingComplete(data) && data.expiresAt && (
                        <div className="flex justify-between py-1 border-b">
                          <span>Време до завршетка</span>
                          <span className="font-medium text-amber-600">
                            {getRemainingTime(data.expiresAt)} (или када сви гласају)
                          </span>
                        </div>
                      )}
                      {data.yourVote && (
                        <div className="flex justify-between py-1 border-b">
                          <span>Ваш глас</span>
                          <div className="flex items-center gap-1">
                            <VoteIcon vote={data.yourVote} />
                            <span>
                              {data.yourVote === "for" && "За"}
                              {data.yourVote === "against" && "Против"}
                              {data.yourVote === "abstain" && "Уздржан"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Sekcija sa napomenom o kvorumu i vremenu glasanja */}
                  {data.quorum.reached && !data.allVoted && !isVotingComplete(data) && data.expiresAt && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4">
                      <div className="flex items-start gap-2">
                        <Timer className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-amber-800">Кворум је достигнут</h3>
                          <p className="text-sm text-amber-700 mt-1">
                            Кворум је достигнут {data.quorum.reachedAt && formatDate(data.quorum.reachedAt)}. 
                            Гласање ће бити затворено за {getRemainingTime(data.expiresAt)} или када сви факултети гласају. 
                            Резултати ће бити видљиви након затварања гласања.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status kvoruma */}
                  {!data.quorum.reached && (
                    <div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span>Напредак кворума: {data.quorum.current} од {data.quorum.required}</span>
                        <span className="text-muted-foreground">
                          {Math.round((data.quorum.current / data.quorum.required) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(data.quorum.current / data.quorum.required) * 100} 
                        className="h-2" 
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Потребно је још {data.quorum.required - data.quorum.current} гласова за достизање кворума.
                        Након достизања кворума, гласање остаје отворено још 48 сати или док сви не гласају.
                      </p>
                    </div>
                  )}
                  
                  {/* Glasovi fakulteta ako je korisnik glasao ili je glasanje završeno */}
                  {(data.yourVote || isVotingComplete(data)) && (
                    <div>
                      <h3 className="font-medium mb-2">Гласови факултета ({data.votes?.length || 0})</h3>
                      <div className="bg-muted p-2 rounded-md space-y-1 max-h-48 overflow-y-auto">
                        {data.votes && data.votes.length > 0 ? (
                          data.votes.map((vote, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center py-1 px-2 text-xs bg-background rounded-sm"
                            >
                              <span>{vote.faculty}</span>
                              <div className="flex items-center gap-2">
                                <VoteIcon vote={vote.vote} />
                                <span className="text-muted-foreground text-xs">
                                  {formatDate(vote.timestamp)}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground p-2">Нема гласова за приказ</p>
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
                      {data.yourVote
                        ? "Већ сте гласали за овај предлог"
                        : isVotingComplete(data)
                        ? "Време за гласање је истекло"
                        : "Одаберите ваш глас за овај предлог"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.yourVote ? (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-600 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            Успешно сте гласали{" "}
                            <span className="font-medium">
                              {data.yourVote === "for" && "ЗА"}
                              {data.yourVote === "against" && "ПРОТИВ"}
                              {data.yourVote === "abstain" && "УЗДРЖАН"}
                            </span>
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Ваша потврда трансакције</h3>
                          <div className="bg-muted p-3 rounded-md text-xs font-mono break-all">
                            0x7f9a12e4b9a3b5c8d6e7f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Ваш глас је забележен у блокчејну и не може бити измењен.
                          </div>
                        </div>
                        
                        {/* Informacije o kvorumu kada je korisnik glasao i kvorum je ispunjen */}
                        {data.quorum.reached && !isVotingComplete(data) && data.expiresAt && (
                          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                            <div className="flex items-start gap-2">
                              <Timer className="h-4 w-4 text-amber-500 mt-0.5" />
                              <div>
                                <h3 className="font-medium text-amber-800">Кворум је достигнут</h3>
                                <p className="text-sm text-amber-700 mt-1">
                                  Кворум је достигнут {data.quorum.reachedAt && formatDate(data.quorum.reachedAt)}. 
                                  Гласање ће бити затворено за {getRemainingTime(data.expiresAt)} или када сви факултети гласају.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {isVotingComplete(data) ? (
                          <Button asChild className="w-full">
                            <Link href={`/votes/${data.id}/results`}>Погледај резултате</Link>
                          </Button>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
                            <div className="flex items-start gap-2">
                              <Lock className="h-4 w-4 text-blue-500 mt-0.5" />
                              <div>
                                <h3 className="font-medium text-blue-800">Резултати ће бити доступни након гласања</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                  {data.quorum.reached && data.expiresAt
                                    ? `Резултати ће бити доступни за ${getRemainingTime(data.expiresAt)} или када сви гласају.`
                                    : "Резултати ће бити доступни након достизања кворума и истека периода гласања."}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : isVotingComplete(data) ? (
                      <div className="space-y-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-gray-500" />
                          <span>Време за гласање је истекло</span>
                        </div>
                        
                        {isVotingComplete(data) && (
                          <Button asChild className="w-full">
                            <Link href={`/votes/${data.id}/results`}>Погледај резултате</Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant={selectedVote === "for" ? "default" : "outline"}
                            className={selectedVote === "for" ? "bg-green-500 hover:bg-green-600" : ""}
                            onClick={() => handleVote("for")}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            За
                          </Button>
                          <Button
                            variant={selectedVote === "against" ? "default" : "outline"}
                            className={selectedVote === "against" ? "bg-red-500 hover:bg-red-600" : ""}
                            onClick={() => handleVote("against")}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Против
                          </Button>
                          <Button
                            variant={selectedVote === "abstain" ? "default" : "outline"}
                            onClick={() => handleVote("abstain")}
                          >
                            <MinusCircle className="mr-1 h-4 w-4" />
                            Уздржан
                          </Button>
                        </div>

                        {selectedVote ? (
                          voteSubmitted ? (
                            <div className="space-y-4">
                              {signatureComplete ? (
                                <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-600 flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Глас успешно забележен!</span>
                                </div>
                              ) : (
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-600">
                                  <div className="text-center mb-2">Потврђивање гласа...</div>
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
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSubmitVote}>
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
                {isVotingComplete(data) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Резултати гласања</CardTitle>
                      <CardDescription>
                        Гласање је завршено {data.closedAt && formatDate(data.closedAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <div className="flex justify-between mb-2">
                            <span className="font-medium">Укупно гласова:</span>
                            <span>
                              {data.result.for + data.result.against + data.result.abstain}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between mb-1 text-sm">
                                <span>За:</span>
                                <span className="font-medium text-green-600">
                                  {data.result.for} (
                                  {Math.round(
                                    (data.result.for /
                                      (data.result.for +
                                        data.result.against +
                                        data.result.abstain)) *
                                      100
                                  )}
                                  %)
                                </span>
                              </div>
                              <Progress
                                value={
                                  (data.result.for /
                                    (data.result.for +
                                      data.result.against +
                                      data.result.abstain)) *
                                  100
                                }
                                className="h-2 bg-slate-200"
                                indicatorClassName="bg-green-500"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between mb-1 text-sm">
                                <span>Против:</span>
                                <span className="font-medium text-red-600">
                                  {data.result.against} (
                                  {Math.round(
                                    (data.result.against /
                                      (data.result.for +
                                        data.result.against +
                                        data.result.abstain)) *
                                      100
                                  )}
                                  %)
                                </span>
                              </div>
                              <Progress
                                value={
                                  (data.result.against /
                                    (data.result.for +
                                      data.result.against +
                                      data.result.abstain)) *
                                  100
                                }
                                className="h-2 bg-slate-200"
                                indicatorClassName="bg-red-500"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between mb-1 text-sm">
                                <span>Уздржани:</span>
                                <span className="font-medium">
                                  {data.result.abstain} (
                                  {Math.round(
                                    (data.result.abstain /
                                      (data.result.for +
                                        data.result.against +
                                        data.result.abstain)) *
                                      100
                                  )}
                                  %)
                                </span>
                              </div>
                              <Progress
                                value={
                                  (data.result.abstain /
                                    (data.result.for +
                                      data.result.against +
                                      data.result.abstain)) *
                                  100
                                }
                                className="h-2 bg-slate-200"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Rezultat - zeleni blok ako je predlog usvojen */}
                        {data.result.for > data.result.against && (
                          <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                              <h3 className="font-medium text-green-800">Предлог усвојен</h3>
                              <p className="text-sm text-green-700 mt-1">
                                Предлог је усвојен већином гласова. Резултати су трајно забележени у блокчејну.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Rezultat - crveni blok ako predlog nije usvojen */}
                        {data.result.for <= data.result.against && (
                          <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
                            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                              <h3 className="font-medium text-red-800">Предлог одбијен</h3>
                              <p className="text-sm text-red-700 mt-1">
                                Предлог није добио довољан број гласова за усвајање. Резултати су трајно забележени у блокчејну.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {data.quorum.reached && !isVotingComplete(data) && data.expiresAt && (
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
                            <span className="text-sm">Време достизања кворума</span>
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
                                Гласање ће бити затворено за {getRemainingTime(data.expiresAt)} или када сви факултети гласају.
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
              <h2 className="text-xl font-semibold mb-4">Блокчејн трансакције</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Трансакције на блокчејну</CardTitle>
                  <CardDescription>
                    Све трансакције везане за овај предлог су трајно забележене на Ethereum блокчејну
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex flex-col p-3 border rounded-md">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">Креирање предлога</div>
                        <Badge variant="outline">Успешно</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(data.dateAdded)}
                      </div>
                      <div className="flex items-center text-xs mt-2">
                        <span className="mr-1 text-muted-foreground">Хеш:</span>
                        <span className="font-mono">0x8f721a5d7cd53d0eb3d1c97...</span>
                      </div>
                    </div>

                    {/* Glasovi na blockchainu */}
                    {data.votes && data.votes.length > 0 && 
                      data.votes.slice(0, 3).map((vote, i) => (
                        <div key={i} className="flex flex-col p-3 border rounded-md">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium">Глас: {vote.faculty}</div>
                            <Badge variant="outline">Успешно</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDate(vote.timestamp)}
                          </div>
                          <div className="flex items-center text-xs mt-2">
                            <span className="mr-1 text-muted-foreground">Хеш:</span>
                            <span className="font-mono">{vote.walletAddress}</span>
                          </div>
                        </div>
                      ))
                    }

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
  )
}
