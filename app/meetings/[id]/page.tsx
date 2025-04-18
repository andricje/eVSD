"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Wallet,
  LogOut,
  Calendar,
  Clock,
  Users,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
} from "lucide-react"

// Simulirani podaci za sednicu
const meetingData = {
  id: 1,
  title: "Redovna sednica VSD",
  date: "2025-04-15T14:00:00",
  status: "upcoming",
  location: "Fakultet tehničkih nauka",
  moderators: ["Ekonomski fakultet", "Pravni fakultet"],
  description: "Redovna mesečna sednica Velikog studentskog doma",
  agenda: [
    {
      id: 1,
      title: "Usvajanje zapisnika sa prethodne sednice",
      description: "Pregled i usvajanje zapisnika sa sednice održane 05.03.2025.",
      status: "pending",
    },
    {
      id: 2,
      title: "Izbor novog predsednika VSD",
      description: "Glasanje za novog predsednika VSD za mandatni period 2025-2026.",
      status: "pending",
      candidates: [
        { id: 1, name: "Marko Marković", faculty: "Fakultet tehničkih nauka" },
        { id: 2, name: "Ana Anić", faculty: "Pravni fakultet" },
        { id: 3, name: "Petar Petrović", faculty: "Ekonomski fakultet" },
      ],
    },
    {
      id: 3,
      title: "Predlog izmena pravilnika o radu",
      description: "Razmatranje i glasanje o predloženim izmenama pravilnika o radu VSD.",
      status: "pending",
      documents: [{ id: 1, name: "Pravilnik_izmene_2025.pdf" }],
    },
  ],
  participants: [
    { id: 1, faculty: "Fakultet tehničkih nauka", representative: "Marko Marković", status: "confirmed" },
    { id: 2, faculty: "Pravni fakultet", representative: "Ana Anić", status: "confirmed" },
    { id: 3, faculty: "Ekonomski fakultet", representative: "Petar Petrović", status: "confirmed" },
    { id: 4, faculty: "Medicinski fakultet", representative: "Jovana Jovanović", status: "pending" },
  ],
}

export default function MeetingDetailPage() {
  const params = useParams()
  const meetingId = params.id

  const [activeVoteItem, setActiveVoteItem] = useState<number | null>(null)
  const [votes, setVotes] = useState<Record<number, string>>({})

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

  const handleVote = (itemId: number, vote: string) => {
    setVotes({
      ...votes,
      [itemId]: vote,
    })
    setActiveVoteItem(null)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-semibold">
            <Wallet className="h-6 w-6" />
            <span>eVSD</span>
          </div>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/dashboard" className="text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/meetings" className="text-sm font-medium">
              Sednice
            </Link>
            <Link href="/votes" className="text-sm font-medium">
              Glasanja
            </Link>
            <Link href="/login" className="text-sm font-medium text-red-500">
              <LogOut className="h-4 w-4 inline mr-1" />
              Odjava
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Nazad
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{meetingData.title}</h1>
            <Badge className="bg-blue-500 ml-auto">Predstojeća</Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dnevni red</CardTitle>
                  <CardDescription>Tačke dnevnog reda za sednicu {formatDate(meetingData.date)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {meetingData.agenda.map((item, index) => (
                      <div key={item.id} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">
                              {index + 1}. {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>

                          {votes[item.id] ? (
                            <div className="flex items-center gap-2">
                              {votes[item.id] === "for" && <Badge className="bg-green-500">Za</Badge>}
                              {votes[item.id] === "against" && <Badge className="bg-red-500">Protiv</Badge>}
                              {votes[item.id] === "abstain" && <Badge variant="outline">Uzdržan</Badge>}
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant={activeVoteItem === item.id ? "default" : "outline"}
                              onClick={() => setActiveVoteItem(activeVoteItem === item.id ? null : item.id)}
                            >
                              Glasaj
                            </Button>
                          )}
                        </div>

                        {activeVoteItem === item.id && (
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500 text-green-500 hover:bg-green-50"
                              onClick={() => handleVote(item.id, "for")}
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Za
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-500 hover:bg-red-50"
                              onClick={() => handleVote(item.id, "against")}
                            >
                              <ThumbsDown className="h-4 w-4 mr-1" />
                              Protiv
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleVote(item.id, "abstain")}>
                              <MinusCircle className="h-4 w-4 mr-1" />
                              Uzdržan
                            </Button>
                          </div>
                        )}

                        {item.candidates && (
                          <div className="pl-4 mt-2 space-y-1">
                            <p className="text-sm font-medium">Kandidati:</p>
                            {item.candidates.map((candidate) => (
                              <p key={candidate.id} className="text-sm">
                                - {candidate.name} ({candidate.faculty})
                              </p>
                            ))}
                          </div>
                        )}

                        {item.documents && (
                          <div className="pl-4 mt-2">
                            <p className="text-sm font-medium">Dokumenti:</p>
                            {item.documents.map((doc) => (
                              <Button key={doc.id} variant="link" className="text-sm p-0 h-auto">
                                {doc.name}
                              </Button>
                            ))}
                          </div>
                        )}

                        {index < meetingData.agenda.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informacije o sednici</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(meetingData.date)}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <div className="font-medium">Moderatori:</div>
                          <div className="text-sm text-muted-foreground">{meetingData.moderators.join(", ")}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Glasanje će biti aktivno tokom sednice</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Učesnici</CardTitle>
                    <CardDescription>
                      {meetingData.participants.filter((p) => p.status === "confirmed").length} potvrđenih
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {meetingData.participants.map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between text-sm">
                          <div>
                            <div>{participant.faculty}</div>
                            <div className="text-xs text-muted-foreground">{participant.representative}</div>
                          </div>
                          {participant.status === "confirmed" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} eVSD. Sva prava zadržana.
          </p>
        </div>
      </footer>
    </div>
  )
}
