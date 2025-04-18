"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Key, Calendar, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Симулирани подаци за изгласане предлоге
const passedProposals = [
  {
    id: 1,
    title: "Усвајање буџета за 2025. годину",
    dateAdded: "2025-04-05T10:00:00",
    datePassed: "2025-04-07T15:30:00",
    description: "Гласање о предлогу буџета ВСД за 2025. годину",
    author: "Економски факултет",
    priority: "high",
    urgent: false,
    result: {
      for: 15,
      against: 3,
      abstain: 2,
    },
    quorum: {
      required: 10,
      current: 20,
      reached: true,
      reachedAt: "2025-04-06T11:30:00",
    },
    status: "closed",
    closedAt: "2025-04-07T15:30:00",
    allVoted: true,
    votes: [
      { faculty: "Факултет техничких наука", vote: "for" },
      { faculty: "Правни факултет", vote: "for" },
      { faculty: "Економски факултет", vote: "for" },
      { faculty: "Медицински факултет", vote: "against" },
      { faculty: "Филозофски факултет", vote: "for" },
      { faculty: "Факултет спорта и физичког васпитања", vote: "abstain" },
      { faculty: "Природно-математички факултет", vote: "for" },
      { faculty: "Пољопривредни факултет", vote: "for" },
      { faculty: "Академија уметности", vote: "for" },
      { faculty: "Факултет техничких наука у Чачку", vote: "for" },
      { faculty: "Грађевински факултет", vote: "against" },
      { faculty: "Електротехнички факултет", vote: "for" },
      { faculty: "Машински факултет", vote: "for" },
      { faculty: "Технолошки факултет", vote: "for" },
      { faculty: "Факултет организационих наука", vote: "for" },
      { faculty: "Факултет политичких наука", vote: "against" },
      { faculty: "Факултет за специјалну едукацију и рехабилитацију", vote: "for" },
      { faculty: "Факултет ветеринарске медицине", vote: "abstain" },
      { faculty: "Факултет спорта и физичког васпитања у Нишу", vote: "for" },
      { faculty: "Учитељски факултет", vote: "for" },
    ],
  },
  {
    id: 2,
    title: "Измене правилника о раду ВСД",
    dateAdded: "2025-04-05T11:00:00",
    datePassed: "2025-04-08T12:15:00",
    description: "Гласање о предложеним изменама правилника о раду ВСД",
    author: "Правни факултет",
    priority: "medium",
    urgent: false,
    result: {
      for: 18,
      against: 0,
      abstain: 2,
    },
    quorum: {
      required: 10,
      current: 20,
      reached: true,
      reachedAt: "2025-04-06T09:15:00",
    },
    status: "closed",
    closedAt: "2025-04-08T12:15:00",
    allVoted: true,
    votes: [
      { faculty: "Факултет техничких наука", vote: "for" },
      { faculty: "Правни факултет", vote: "for" },
      { faculty: "Економски факултет", vote: "for" },
      { faculty: "Медицински факултет", vote: "for" },
      { faculty: "Филозофски факултет", vote: "for" },
      { faculty: "Факултет спорта и физичког васпитања", vote: "abstain" },
      { faculty: "Природно-математички факултет", vote: "for" },
      { faculty: "Пољопривредни факултет", vote: "for" },
      { faculty: "Академија уметности", vote: "for" },
      { faculty: "Факултет техничких наука у Чачку", vote: "for" },
      { faculty: "Грађевински факултет", vote: "for" },
      { faculty: "Електротехнички факултет", vote: "for" },
      { faculty: "Машински факултет", vote: "for" },
      { faculty: "Технолошки факултет", vote: "for" },
      { faculty: "Факултет организационих наука", vote: "for" },
      { faculty: "Факултет политичких наука", vote: "for" },
      { faculty: "Факултет за специјалну едукацију и рехабилитацију", vote: "for" },
      { faculty: "Факултет ветеринарске медицине", vote: "abstain" },
      { faculty: "Факултет спорта и физичког васпитања у Нишу", vote: "for" },
      { faculty: "Учитељски факултет", vote: "for" },
    ],
  },
  {
    id: 7,
    title: "Усвајање плана рада за летњи семестар",
    dateAdded: "2025-03-15T09:00:00",
    datePassed: "2025-03-20T14:45:00",
    description: "Гласање о плану рада ВСД за летњи семестар 2025. године",
    author: "Факултет организационих наука",
    priority: "medium",
    urgent: true,
    result: {
      for: 16,
      against: 1,
      abstain: 3,
    },
    quorum: {
      required: 10,
      current: 20,
      reached: true,
      reachedAt: "2025-03-15T16:20:00",
    },
    status: "closed",
    closedAt: "2025-03-20T14:45:00",
    allVoted: false,
    votes: [
      { faculty: "Факултет техничких наука", vote: "for" },
      { faculty: "Правни факултет", vote: "for" },
      { faculty: "Економски факултет", vote: "for" },
      { faculty: "Медицински факултет", vote: "for" },
      { faculty: "Филозофски факултет", vote: "for" },
      { faculty: "Факултет спорта и физичког васпитања", vote: "abstain" },
      { faculty: "Природно-математички факултет", vote: "for" },
      { faculty: "Пољопривредни факултет", vote: "for" },
      { faculty: "Академија уметности", vote: "for" },
      { faculty: "Факултет техничких наука у Чачку", vote: "for" },
      { faculty: "Грађевински факултет", vote: "against" },
      { faculty: "Електротехнички факултет", vote: "for" },
      { faculty: "Машински факултет", vote: "for" },
      { faculty: "Технолошки факултет", vote: "for" },
      { faculty: "Факултет организационих наука", vote: "for" },
      { faculty: "Факултет политичких наука", vote: "for" },
      { faculty: "Факултет за специјалну едукацију и рехабилитацију", vote: "for" },
      { faculty: "Факултет ветеринарске медицине", vote: "abstain" },
      { faculty: "Факултет спорта и физичког васпитања у Нишу", vote: "for" },
      { faculty: "Учитељски факултет", vote: "abstain" },
    ],
  },
  {
    id: 8,
    title: "Избор представника за Студентски парламент",
    dateAdded: "2025-02-20T13:30:00",
    datePassed: "2025-02-25T16:20:00",
    description: "Гласање за представнике ВСД у Студентском парламенту",
    author: "Факултет политичких наука",
    priority: "high",
    urgent: true,
    result: {
      for: 14,
      against: 2,
      abstain: 4,
    },
    quorum: {
      required: 10,
      current: 20,
      reached: true,
      reachedAt: "2025-02-21T10:15:00",
    },
    status: "closed",
    closedAt: "2025-02-25T16:20:00",
    allVoted: false,
    votes: [
      { faculty: "Факултет техничких наука", vote: "for" },
      { faculty: "Правни факултет", vote: "for" },
      { faculty: "Економски факултет", vote: "for" },
      { faculty: "Медицински факултет", vote: "against" },
      { faculty: "Филозофски факултет", vote: "for" },
      { faculty: "Факултет спорта и физичког васпитања", vote: "abstain" },
      { faculty: "Природно-математички факултет", vote: "for" },
      { faculty: "Пољопривредни факултет", vote: "for" },
      { faculty: "Академија уметности", vote: "for" },
      { faculty: "Факултет техничких наука у Чачку", vote: "for" },
      { faculty: "Грађевински факултет", vote: "against" },
      { faculty: "Електротехнички факултет", vote: "for" },
      { faculty: "Машински факултет", vote: "for" },
      { faculty: "Технолошки факултет", vote: "for" },
      { faculty: "Факултет организационих наука", vote: "for" },
      { faculty: "Факултет политичких наука", vote: "for" },
      { faculty: "Факултет за специјалну едукацију и рехабилитацију", vote: "for" },
      { faculty: "Факултет ветеринарске медицине", vote: "abstain" },
      { faculty: "Факултет спорта и физичког васпитања у Нишу", vote: "abstain" },
      { faculty: "Учитељски факултет", vote: "abstain" },
    ],
  },
  {
    id: 9,
    title: "Предлог за организацију студентске конференције",
    dateAdded: "2025-04-01T08:00:00",
    datePassed: "2025-04-03T08:00:00",
    description: "Гласање о предлогу за организацију међународне студентске конференције",
    author: "Факултет организационих наука",
    priority: "low",
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
    status: "closed",
    closedAt: "2025-04-03T08:00:00",
    allVoted: false,
    votes: [
      { faculty: "Факултет техничких наука", vote: "for" },
      { faculty: "Правни факултет", vote: "for" },
      { faculty: "Економски факултет", vote: "for" },
      { faculty: "Медицински факултет", vote: "for" },
      { faculty: "Филозофски факултет", vote: "for" },
      { faculty: "Факултет спорта и физичког васпитања", vote: "for" },
      { faculty: "Природно-математички факултет", vote: "for" },
      { faculty: "Пољопривредни факултет", vote: "for" },
      { faculty: "Академија уметности", vote: "for" },
      { faculty: "Факултет техничких наука у Чачку", vote: "for" },
      { faculty: "Грађевински факултет", vote: "for" },
      { faculty: "Електротехнички факултет", vote: "for" },
    ],
  },
]

// Форматирање датума
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

// Priority badge
const PriorityBadge = ({ priority }: { priority: string }) => {
  if (priority === "high") {
    return <Badge className="bg-red-500">Висок приоритет</Badge>
  } else if (priority === "medium") {
    return <Badge className="bg-amber-500">Средњи приоритет</Badge>
  } else {
    return <Badge className="bg-blue-500">Низак приоритет</Badge>
  }
}

// Status badge
const StatusBadge = ({ status, urgent }: { status: string; urgent: boolean }) => {
  if (status === "closed") {
    return <Badge className="bg-green-500">Завршено</Badge>
  } else if (status === "expiring") {
    return urgent ? 
      <Badge className="bg-red-500">Хитно - квор. достигнут</Badge> : 
      <Badge className="bg-amber-500">Квор. достигнут</Badge>
  } else if (status === "expired") {
    return <Badge className="bg-gray-500">Време истекло</Badge>
  } else if (status === "active") {
    return urgent ? 
      <Badge className="bg-red-500">Хитно</Badge> : 
      <Badge variant="outline">Активно</Badge>
  }
  return null
}

export default function RezultatiPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterDate, setFilterDate] = useState("all")
  const [expandedProposal, setExpandedProposal] = useState<number | null>(null)

  // Филтрирање предлога
  const filteredProposals = passedProposals.filter((proposal) => {
    // Претрага по наслову или опису
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.author.toLowerCase().includes(searchTerm.toLowerCase())

    // Филтер по приоритету
    const matchesPriority = filterPriority === "all" || proposal.priority === filterPriority

    // Филтер по датуму
    let matchesDate = true
    if (filterDate === "month") {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      matchesDate = new Date(proposal.datePassed) > oneMonthAgo
    } else if (filterDate === "quarter") {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      matchesDate = new Date(proposal.datePassed) > threeMonthsAgo
    } else if (filterDate === "year") {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      matchesDate = new Date(proposal.datePassed) > oneYearAgo
    }

    return matchesSearch && matchesPriority && matchesDate
  })

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

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b w-full">
        <div className="w-full max-w-full flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-semibold">
            <Key className="h-6 w-6" />
            <span>еВСД - Јавни резултати</span>
          </div>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/" className="text-sm font-medium">
              Почетна
            </Link>
            <Link href="/login" className="text-sm font-medium">
              Пријава
            </Link>
          </nav>
        </div>
      </header>
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
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Филтер по приоритету" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Сви приоритети</SelectItem>
                  <SelectItem value="high">Висок приоритет</SelectItem>
                  <SelectItem value="medium">Средњи приоритет</SelectItem>
                  <SelectItem value="low">Низак приоритет</SelectItem>
                </SelectContent>
              </Select>
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
                        <CardTitle className="text-xl">{proposal.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Предложио: {proposal.author} | Усвојено: {formatDate(proposal.datePassed)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <PriorityBadge priority={proposal.priority} />
                        {proposal.urgent && <Badge className="bg-red-500">Хитно</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{proposal.description}</p>

                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Резултат гласања</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <Badge className="bg-green-500">За</Badge>
                            <span className="ml-1">{proposal.result.for}</span>
                          </div>
                          <div className="flex items-center">
                            <Badge className="bg-red-500">Против</Badge>
                            <span className="ml-1">{proposal.result.against}</span>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline">Уздржан</Badge>
                            <span className="ml-1">{proposal.result.abstain}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Кворум</p>
                        <div className="flex items-center">
                          <span>
                            {proposal.quorum.current}/{proposal.quorum.required}
                          </span>
                          <Badge className="bg-green-500 ml-2">Достигнут</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Статус</p>
                        <StatusBadge status={proposal.status} urgent={proposal.urgent} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedProposal(expandedProposal === proposal.id ? null : proposal.id)
                        }
                      >
                        {expandedProposal === proposal.id ? "Сакриј детаље" : "Прикажи детаље гласања"}
                      </Button>

                      {expandedProposal === proposal.id && (
                        <div className="mt-4 border rounded-md p-4">
                          <h3 className="text-sm font-medium mb-2">Детаљи гласања по факултетима</h3>
                          <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                            {proposal.votes.map((vote, index) => (
                              <div key={index} className="flex justify-between py-1 border-b text-sm">
                                <span>{vote.faculty}</span>
                                <VoteBadge vote={vote.vote} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">Нема резултата за приказ</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Покушајте да измените филтере или претрагу да бисте видели резултате
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
  )
}
