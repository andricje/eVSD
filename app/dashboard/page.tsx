"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Wallet,
  LogOut,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Calendar,
  History,
  Shield,
  Timer,
  Vote,
  FileUp,
  Lock,
  AlertTriangle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWallet } from "@/context/wallet-context"
import { WalletInfo } from "@/components/wallet-info"

// Simulirani podaci za predloge
const proposals = [
  {
    id: 1,
    title: "Усвајање буџета за 2025. годину",
    dateAdded: "2025-04-05T10:00:00",
    description: "Гласање о предлогу буџета ВСД за 2025. годину",
    author: "Економски факултет",
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
      reachedAt: "2025-04-06T11:30:00",
    },
    status: "closed", // заворен предлог
    closedAt: "2025-04-07T15:30:00",
    allVoted: true,
  },
  {
    id: 2,
    title: "Измене правилника о раду ВСД",
    dateAdded: "2025-04-05T11:00:00",
    description: "Гласање о предложеним изменама правилника о раду ВСД",
    author: "Правни факултет",
    urgent: false,
    result: {
      for: 18,
      against: 0,
      abstain: 2,
    },
    yourVote: "for",
    quorum: {
      required: 10,
      current: 20,
      reached: true,
      reachedAt: "2025-04-06T09:15:00",
    },
    status: "closed", // заворен предлог
    closedAt: "2025-04-08T12:15:00",
    allVoted: true,
  },
  {
    id: 3,
    title: "Избор новог председника ВСД",
    dateAdded: "2025-04-10T14:00:00",
    description: "Гласање за новог председника ВСД за мандатни период 2025-2026",
    author: "Факултет техничких наука",
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
      reachedAt: "2025-04-11T09:30:00",
    },
    status: "expiring", // квору достигнут, истиче ускоро
    expiresAt: "2025-04-12T14:00:00", // 48h након достизања кворума
    allVoted: false,
  },
  {
    id: 4,
    title: "Измене правилника о студентским домовима",
    dateAdded: "2025-04-12T09:30:00",
    description: "Предлог измена правилника о студентским домовима",
    author: "Факултет спорта и физичког васпитања",
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
    status: "active", // активан предлог
    allVoted: false,
  },
  {
    id: 5,
    title: "Usvajanje izveštaja o radu za 2024. godinu",
    dateAdded: "2025-04-05T10:00:00",
    description: "Glasanje o izveštaju o radu VSD za 2024. godinu.",
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
  },
  {
    id: 6,
    title: "Predlog za izmenu statuta studentskih organizacija",
    dateAdded: "2025-04-15T15:00:00",
    description: "Predlog za izmenu statuta studentskih organizacija.",
    author: "Filozofski fakultet",
    urgent: false,
    result: {
      for: 10,
      against: 0,
      abstain: 0,
    },
    yourVote: "for",
    quorum: {
      required: 10,
      current: 10,
      reached: true,
      reachedAt: "2025-04-15T21:45:00",
    },
    status: "expiring", // aktivno, korisnik glasao, kvorum dostignut
    expiresAt: "2025-04-17T21:45:00", // 48h nakon dostizanja kvoruma
    allVoted: false,
  },
  {
    id: 7,
    title: "Usvajanje plana rada za letnji semestar",
    dateAdded: "2025-03-15T09:00:00",
    description: "Glasanje o planu rada VSD za letnji semestar 2025. godine",
    author: "Fakultet organizacionih nauka",
    urgent: true,
    result: {
      for: 16,
      against: 1,
      abstain: 3,
    },
    quorum: {
      required: 10,
      current: 12,
      reached: true,
      reachedAt: "2025-03-15T16:20:00",
    },
    status: "expiring", // hitno, kvorum dostignut, ali korisnik nije glasao
    expiresAt: "2025-04-22T16:20:00",
    allVoted: false,
  },
  {
    id: 8,
    title: "Izbor predstavnika za Studentski parlament",
    dateAdded: "2025-02-20T13:30:00",
    description: "Glasanje za predstavnike VSD u Studentskom parlamentu",
    author: "Fakultet političkih nauka",
    urgent: true,
    result: {
      for: 14,
      against: 2,
      abstain: 4,
    },
    yourVote: "against",
    quorum: {
      required: 10,
      current: 20,
      reached: true,
      reachedAt: "2025-02-21T10:15:00",
    },
    status: "expired", // kvorum dostignut, vreme isteklo
    expiresAt: "2025-02-25T16:20:00", // 48h nakon dostizanja kvoruma (već isteklo)
    allVoted: false,
  },
  {
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
      reachedAt: "2025-04-02T14:30:00",
    },
    status: "expired", // kvorum dostignut, vreme isteklo
    expiresAt: "2025-04-03T08:00:00", // 48h nakon dostizanja kvoruma (već isteklo)
    allVoted: false,
  },
  {
    id: 10,
    title: "Regulisanje dodatnih studentskih aktivnosti",
    dateAdded: "2025-04-16T11:30:00",
    description: "Predlog za regulisanje dodatnih studentskih aktivnosti u okviru univerziteta",
    author: "Fakultet sporta i fizičkog vaspitanja",
    urgent: false,
    result: {
      for: 2,
      against: 0,
      abstain: 1,
    },
    quorum: {
      required: 10,
      current: 3,
      reached: false,
    },
    status: "active", // aktivan predlog bez kvoruma
    allVoted: false,
  },
  {
    id: 11,
    title: "Hitno glasanje o finansiranju studentskih projekata",
    dateAdded: "2025-04-15T08:00:00",
    description: "Hitno glasanje o odobravanju sredstava za studentske projekte u tekućem semestru",
    author: "Ekonomski fakultet",
    urgent: true,
    result: {
      for: 8,
      against: 1,
      abstain: 0,
    },
    quorum: {
      required: 12,
      current: 9,
      reached: false,
    },
    status: "active", // hitno, nema kvoruma
    allVoted: false,
  },
  {
    id: 12,
    title: "Definisanje postupka prijavljivanja ispita",
    dateAdded: "2025-04-14T10:15:00",
    description: "Predlog za definisanje standardizovanog postupka prijavljivanja ispita",
    author: "Fakultet organizacionih nauka",
    urgent: false,
    result: {
      for: 5,
      against: 0,
      abstain: 0,
    },
    yourVote: "for",
    quorum: {
      required: 12,
      current: 5,
      reached: false,
    },
    status: "active", // korisnik glasao, nema kvoruma
    allVoted: false,
  },
]

// Simulirani podaci za istoriju logovanja
const loginHistory = [
  {
    id: 1,
    date: "2025-04-10T15:30:45",
    device: "Windows PC (Chrome)",
    ipAddress: "192.168.1.105",
    status: "success",
  },
  {
    id: 2,
    date: "2025-04-08T09:15:22",
    device: "Windows PC (Chrome)",
    ipAddress: "192.168.1.105",
    status: "success",
  },
  {
    id: 3,
    date: "2025-04-05T14:22:10",
    device: "Windows PC (Chrome)",
    ipAddress: "192.168.1.105",
    status: "success",
  },
  {
    id: 4,
    date: "2025-04-01T11:05:33",
    device: "Windows PC (Chrome)",
    ipAddress: "192.168.10.45",
    status: "failed",
    reason: "Neautorizovani novčanik",
  },
  {
    id: 5,
    date: "2025-03-28T16:40:12",
    device: "Windows PC (Chrome)",
    ipAddress: "192.168.1.105",
    status: "success",
  },
]

// Simulirani podaci za istoriju glasanja
const voteHistory = [
  {
    id: 1,
    proposalId: 1,
    proposalTitle: "Usvajanje budžeta za 2025. godinu",
    date: "2025-04-05T10:32:15",
    vote: "for",
    device: "Windows PC (Chrome)",
  },
  {
    id: 2,
    proposalId: 2,
    proposalTitle: "Izmene pravilnika o radu VSD",
    date: "2025-04-05T11:15:30",
    vote: "for",
    device: "Windows PC (Chrome)",
  },
  {
    id: 3,
    proposalId: 7,
    proposalTitle: "Usvajanje plana rada za letnji semestar",
    date: "2025-03-15T09:45:20",
    vote: "for",
    device: "Windows PC (Chrome)",
  },
  {
    id: 4,
    proposalId: 8,
    proposalTitle: "Izbor predstavnika za Studentski parlament",
    date: "2025-02-20T14:10:05",
    vote: "against",
    device: "Windows PC (Chrome)",
  },
]

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

// Funkcija za računanje preostalog vremena
const getRemainingTime = (expiresAt: string) => {
  const now = new Date()
  const expiration = new Date(expiresAt)
  const diffMs = expiration.getTime() - now.getTime()

  if (diffMs <= 0) return "Isteklo"

  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return `${diffHrs}h ${diffMins}m`
}

// Funkcija koja proverava da li je vreme za glasanje isteklo
const hasVotingTimeExpired = (proposal: any) => {
  if (!proposal.expiresAt) return false

  const now = new Date()
  const expirationDate = new Date(proposal.expiresAt)

  return now > expirationDate
}

// Funkcija koja proverava da li je glasanje završeno
const isVotingComplete = (proposal: any) => {
  return proposal.status === "closed" || proposal.status === "expired"
}

// Status badge
const StatusBadge = ({ status, expiresAt, urgent }: { status: string; expiresAt?: string; urgent?: boolean }) => {
  if (urgent) {
    return <Badge className="bg-red-500">Хитно</Badge>
  }

  if (status === "closed") {
    return <Badge className="bg-green-500">Затворено</Badge>
  } else if (status === "expired") {
    return <Badge className="bg-gray-500">Истекло</Badge>
  } else if (status === "expiring" && expiresAt) {
    return (
      <Badge className="bg-amber-500">
        <Timer className="h-3 w-3 mr-1" />
        Истиче за {getRemainingTime(expiresAt)}
      </Badge>
    )
  } else {
    return <Badge className="bg-blue-500">Активно</Badge>
  }
}

// Funkcija za grupisanje predloga po datumu (za aktivne predloge)
const groupProposalsByDate = (proposals: any[]) => {
  const grouped: Record<string, any[]> = {}
  
  proposals.forEach(proposal => {
    const date = new Date(proposal.dateAdded)
    const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD format
    
    if (!grouped[dateString]) {
      grouped[dateString] = []
    }
    
    grouped[dateString].push(proposal)
  })
  
  // Sortiraj datume od najnovijeg
  return Object.entries(grouped)
    .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
    .map(([date, props]) => ({
      date,
      proposals: props
    }))
}

export default function Dashboard() {
  const { wallet, authorizedWallet } = useWallet()
  const [activeTab, setActiveTab] = useState("glasanje")

  // Vote badge
  const VoteBadge = ({ vote }: { vote: string }) => {
    if (vote === "for") {
      return <Badge className="bg-green-500">За</Badge>
    } else if (vote === "against") {
      return <Badge className="bg-red-500">Против</Badge>
    } else {
      return <Badge variant="outline">Уздржан</Badge>
    }
  }

  const [newProposal, setNewProposal] = useState({
    title: "",
    description: "",
    urgent: false,
    document: null as File | null,
  })
  const [proposalSubmitted, setProposalSubmitted] = useState(false)
  const [documentName, setDocumentName] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewProposal({ ...newProposal, document: e.target.files[0] })
      setDocumentName(e.target.files[0].name)
    }
  }

  const handleProposalSubmit = () => {
    // Ovde bi se u pravoj implementaciji slao zahtev na server
    console.log("Predlog poslat:", newProposal)
    setProposalSubmitted(true)

    // Reset forme nakon 3 sekunde
    setTimeout(() => {
      setProposalSubmitted(false)
      setNewProposal({
        title: "",
        description: "",
        urgent: false,
        document: null,
      })
      setDocumentName("")
    }, 3000)
  }

  // Predlozi koji ističu uskoro (kvorum dostignut, ali vreme nije isteklo)
  const expiringProposals = proposals.filter(
    (proposal) => proposal.status === "expiring" && !proposal.yourVote && !hasVotingTimeExpired(proposal),
  )

  // Aktivni predlozi za koje korisnik NIJE glasao
  const activeProposalsToVote = proposals.filter(
    (proposal) =>
      (proposal.status === "active" || proposal.status === "expiring") &&
      !proposal.yourVote &&
      !(proposal.status === "expiring" && hasVotingTimeExpired(proposal)),
  )

  // Predlozi za koje je korisnik glasao i glasanje nije završeno
  const votedActiveProposals = proposals.filter(
    (proposal) => 
      proposal.yourVote && 
      (proposal.status === "active" || proposal.status === "expiring") &&
      !isVotingComplete(proposal)
  )
  
  // Predlozi za koje je korisnik glasao i glasanje je završeno
  const votedCompletedProposals = proposals.filter(
    (proposal) => 
      proposal.yourVote && 
      isVotingComplete(proposal)
  )

  // Svi predlozi za koje je korisnik glasao (za kompatibilnost sa postojećim kodom)
  const votedProposals = proposals.filter((proposal) => proposal.yourVote)

  // Predlozi gde korisnik treba da glasa, sa dostupnim kvorumom
  const proposalsWithQuorum = activeProposalsToVote.filter(p => p.quorum.reached)
  
  // Predlozi gde korisnik treba da glasa, bez kvoruma
  const proposalsWithoutQuorum = activeProposalsToVote.filter(p => !p.quorum.reached)

  // Grupiši aktivne predloge po datumu
  const groupedActiveProposals = groupProposalsByDate(activeProposalsToVote)

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b w-full">
        <div className="w-full max-w-full flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-semibold">
            <Wallet className="h-6 w-6" />
            <span>еВСД</span>
          </div>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/dashboard" className="text-sm font-medium">
              Дашборд
            </Link>
            <Link href="/rezultati" className="text-sm font-medium">
              Јавни резултати
            </Link>
            <Link href="/login" className="text-sm font-medium text-red-500">
              <LogOut className="h-4 w-4 inline mr-1" />
              Одјава
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Дашборд</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Последња активност: {formatDate(new Date().toISOString())}</span>
            </div>
          </div>

          {wallet && authorizedWallet && <WalletInfo />}

          <Card>
            <CardHeader>
              <CardTitle>Блокчејн гласање и управљање седницама</CardTitle>
              <CardDescription>Преглед активних предлога и историје гласања</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1 p-3 border rounded-md">
                  <div className="text-sm font-medium text-muted-foreground">Статус новчаника</div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Активан</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-3 border rounded-md">
                  <div className="text-sm font-medium text-muted-foreground">Активни предлози</div>
                  <div className="font-medium">{activeProposalsToVote.length}</div>
                </div>
                <div className="flex flex-col gap-1 p-3 border rounded-md">
                  <div className="text-sm font-medium text-muted-foreground">Са доступним кворумом</div>
                  <div className="font-medium">{proposalsWithQuorum.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Преглед активности</h2>
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
                  <DialogDescription>Попуните формулар да бисте додали нови предлог за гласање.</DialogDescription>
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
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Наслов предлога</Label>
                        <Input
                          id="title"
                          value={newProposal.title}
                          onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                          placeholder="Унесите наслов предлога"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Опис предлога</Label>
                        <Textarea
                          id="description"
                          value={newProposal.description}
                          onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                          placeholder="Детаљно опишите ваш предлог"
                          rows={6}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="urgent"
                          checked={newProposal.urgent}
                          onChange={(e) => setNewProposal({ ...newProposal, urgent: e.target.checked })}
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
                          {documentName && <span className="text-sm text-muted-foreground">{documentName}</span>}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleProposalSubmit}>
                        Додај предлог
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="glasanje" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="glasanje">
                <Vote className="h-4 w-4 mr-2" />
                Гласање
              </TabsTrigger>
              <TabsTrigger value="istorija-glasanja">
                <History className="h-4 w-4 mr-2" />
                Историја гласања
              </TabsTrigger>
              <TabsTrigger value="istorija-logovanja">
                <Shield className="h-4 w-4 mr-2" />
                Историја логовања
              </TabsTrigger>
            </TabsList>

            <TabsContent value="glasanje">
              {activeProposalsToVote.length > 0 ? (
                <div className="space-y-8">
                  {/* Predlozi sa dostignutim kvorumom */}
                  {proposalsWithQuorum.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-green-600">
                        Предлози са достигнутим кворумом
                      </h3>
                      <div className="space-y-4">
                        {proposalsWithQuorum.map((proposal) => (
                          <Card key={proposal.id} className={proposal.urgent ? "border-red-200" : "border-green-200"}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle>{proposal.title}</CardTitle>
                                  <CardDescription>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(proposal.dateAdded)}
                                      </div>
                                      <div>Предложио: {proposal.author}</div>
                                    </div>
                                  </CardDescription>
                                </div>
                                <StatusBadge
                                  status={proposal.status}
                                  expiresAt={proposal.expiresAt}
                                  urgent={proposal.urgent}
                                />
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">{proposal.description}</p>
                              
                              <div className="mt-3 bg-green-50 border border-green-200 rounded-md p-2 text-green-700 flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                <div>
                                  <div className="font-medium text-sm">Кворум је достигнут</div>
                                  {proposal.quorum.reachedAt && (
                                    <div className="text-xs">Достигнут: {formatDate(proposal.quorum.reachedAt)}</div>
                                  )}
                                  {proposal.expiresAt && (
                                    <div className="text-xs mt-1">
                                      Гласање активно још {getRemainingTime(proposal.expiresAt)}
                                      {!proposal.allVoted && " или док сви не гласају"}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button asChild className={proposal.urgent ? "bg-red-600 hover:bg-red-700" : ""}>
                                <Link href={`/votes/${proposal.id}`}>Гласај</Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Predlozi bez kvoruma */}
                  {proposalsWithoutQuorum.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-muted-foreground">
                        Предлози без кворума
                      </h3>
                      <div className="space-y-4">
                        {proposalsWithoutQuorum.map((proposal) => (
                          <Card key={proposal.id} className={proposal.urgent ? "border-amber-200" : ""}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle>{proposal.title}</CardTitle>
                                  <CardDescription>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(proposal.dateAdded)}
                                      </div>
                                      <div>Предложио: {proposal.author}</div>
                                    </div>
                                  </CardDescription>
                                </div>
                                <StatusBadge
                                  status={proposal.status}
                                  expiresAt={proposal.expiresAt}
                                  urgent={proposal.urgent}
                                />
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">{proposal.description}</p>
                              
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm">
                                    Кворум: {proposal.quorum.current}/{proposal.quorum.required}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round((proposal.quorum.current / proposal.quorum.required) * 100)}%
                                  </span>
                                </div>
                                <Progress
                                  value={(proposal.quorum.current / proposal.quorum.required) * 100}
                                  className="h-2 mb-2"
                                />
                                <p className="text-xs text-amber-600">
                                  Потребно још {proposal.quorum.required - proposal.quorum.current} гласова за достизање кворума
                                </p>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button asChild>
                                <Link href={`/votes/${proposal.id}`}>Гласај</Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">Нема активних предлога за гласање</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Сви активни предлози ће бити приказани овде када буду доступни
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="istorija-glasanja">
              <Card>
                <CardHeader>
                  <CardTitle>Историја гласања</CardTitle>
                  <CardDescription>Преглед свих ваших гласова</CardDescription>
                </CardHeader>
                <CardContent>
                  {votedProposals.length > 0 ? (
                    <div className="space-y-6">
                      {/* Активна гласања где је корисник гласао */}
                      {votedActiveProposals.length > 0 && (
                        <div>
                          <h3 className="text-md font-medium mb-3">Активна гласања где сте гласали</h3>
                          <div className="space-y-4">
                            {/* Прво прикажи оне са кворумом */}
                            {votedActiveProposals.filter(p => p.quorum.reached).length > 0 && (
                              <div className="mb-3">
                                <h4 className="text-sm font-medium text-green-600 mb-2">Са доступним кворумом</h4>
                                <div className="space-y-3">
                                  {votedActiveProposals
                                    .filter(p => p.quorum.reached)
                                    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
                                    .map((proposal) => (
                                      <div key={proposal.id} className="flex justify-between items-center p-3 border border-green-100 rounded-md bg-green-50">
                                        <div>
                                          <div className="font-medium">{proposal.title}</div>
                                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                                            <span>Гласали сте: {formatDate(proposal.dateAdded)}</span>
                                            <VoteBadge vote={proposal.yourVote || "for"} />
                                          </div>
                                          <div className="text-xs mt-1 flex items-center gap-1">
                                            <span>Предложио: {proposal.author}</span>
                                          </div>
                                          <div className="text-xs mt-1 text-green-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span>
                                              Кворум достигнут: {proposal.quorum.reachedAt && formatDate(proposal.quorum.reachedAt)}
                                              {proposal.expiresAt && ` - Активно још ${getRemainingTime(proposal.expiresAt)}`}
                                            </span>
                                          </div>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                          <Link href={`/votes/${proposal.id}`}>Детаљи</Link>
                                        </Button>
                                      </div>
                                    ))
                                  }
                                </div>
                              </div>
                            )}

                            {/* Затим прикажи оне без кворума */}
                            {votedActiveProposals.filter(p => !p.quorum.reached).length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-amber-600 mb-2">У току прикупљања кворума</h4>
                                <div className="space-y-3">
                                  {votedActiveProposals
                                    .filter(p => !p.quorum.reached)
                                    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
                                    .map((proposal) => (
                                      <div key={proposal.id} className="flex justify-between items-center p-3 border border-amber-100 rounded-md bg-amber-50">
                                        <div>
                                          <div className="font-medium">{proposal.title}</div>
                                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                                            <span>Гласали сте: {formatDate(proposal.dateAdded)}</span>
                                            <VoteBadge vote={proposal.yourVote || "for"} />
                                          </div>
                                          <div className="text-xs mt-1 flex items-center gap-1">
                                            <span>Предложио: {proposal.author}</span>
                                          </div>
                                          <div className="text-xs mt-1 text-amber-600 flex items-center gap-1">
                                            <Timer className="h-3 w-3" />
                                            <span>
                                              Прикупљање кворума: {proposal.quorum.current}/{proposal.quorum.required} 
                                              (потребно још {proposal.quorum.required - proposal.quorum.current})
                                            </span>
                                          </div>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                          <Link href={`/votes/${proposal.id}`}>Детаљи</Link>
                                        </Button>
                                      </div>
                                    ))
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Завршена гласања где је корисник гласао */}
                      {votedCompletedProposals.length > 0 && (
                        <div>
                          <h3 className="text-md font-medium mb-3">Завршена гласања</h3>
                          <div className="space-y-4">
                            {votedCompletedProposals
                              .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
                              .map((proposal) => (
                                <div key={proposal.id} className="flex justify-between items-center p-3 border rounded-md">
                                  <div>
                                    <div className="font-medium">{proposal.title}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                      <span>Гласали сте: {formatDate(proposal.dateAdded)}</span>
                                      <VoteBadge vote={proposal.yourVote || "for"} />
                                    </div>
                                    <div className="text-xs mt-1">
                                      <span>Затворено: {proposal.closedAt ? formatDate(proposal.closedAt) : 'N/A'}</span>
                                    </div>
                                    <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Резултати гласања су доступни
                                    </div>
                                  </div>
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/votes/${proposal.id}`}>Резултати</Link>
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-lg text-muted-foreground">Нема историје гласања</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Ваши гласови ће бити приказани овде након што гласате
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="istorija-logovanja">
              <Card>
                <CardHeader>
                  <CardTitle>Историја логовања</CardTitle>
                  <CardDescription>Преглед свих ваших пријава на систем</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loginHistory.map((login) => (
                      <div
                        key={login.id}
                        className={`flex justify-between items-center p-3 border rounded-md ${
                          login.status === "failed" ? "bg-red-50 border-red-200" : ""
                        }`}
                      >
                        <div>
                          <div className="font-medium">
                            {formatDate(login.date)}{" "}
                            {login.status === "failed" && (
                              <Badge variant="destructive" className="ml-2">
                                Неуспешно
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">ИП: {login.ipAddress}</div>
                          <div className="text-xs text-muted-foreground mt-1">Уређај: {login.device}</div>
                          {login.reason && <div className="text-xs text-red-500 mt-1">Разлог: {login.reason}</div>}
                        </div>
                        <div className="flex items-center">
                          {login.status === "success" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
  )
}
