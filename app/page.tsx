import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Wallet, FileCheck } from "lucide-react";
import { Header } from "@/components/header";
import { DonationsSection } from "@/components/donations/donations-section";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-blue-50 to-white">
          <div className="w-full max-w-full px-4 md:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  еВСД – Blockchain систем за седнице и гласање
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Модернизација и дигитализација процеса ВСД кроз безбедан,
                  транспарентан и децентрализован систем
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild>
                  <Link href="/login">Пријава са крипто новчаником</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/rezultati">Преглед јавних резултата</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full ">
          <div className="w-full max-w-full px-4 md:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-12">
              Предности blockchain гласања
            </h2>
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader>
                  <Wallet className="h-6 w-6 mb-2 text-blue-500" />
                  <CardTitle>Крипто новчаник за приступ</CardTitle>
                  <CardDescription>
                    Аутентификација корисника помоћу blockchain технологије
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Сваки факултет користи свој јединствени крипто новчаник за
                    приступ систему и гласање, обезбеђујући највиши ниво
                    сигурности и транспарентности Svaki fakultet koristi svoj
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <FileCheck className="h-6 w-6 mb-2 text-blue-500" />
                  <CardTitle>Непромењиви записи</CardTitle>
                  <CardDescription>
                    Сви гласови су трајно забележени на blockchain-у
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Једном када се глас забележи на blockchain-у, не може се
                    променити или избрисати, што гарантује интегритет гласања и
                    спечава манипулације.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Shield className="h-6 w-6 mb-2 text-blue-500" />
                  <CardTitle>Дигитална верификација</CardTitle>
                  <CardDescription>
                    Сваки глас се дигитално потписује помоћу новчаника
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Гласови се бележе са датумом, временом и дигиталним
                    потписом, гарантујући аутентичност и спречавајући
                    злоупотребе.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <DonationsSection />
      </main>
      <footer className="border-t py-6 bg-muted w-full">
        <div className="w-full max-w-full flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} еВСД. Сва права задржана.
          </p>
        </div>
      </footer>
    </div>
  );
}
