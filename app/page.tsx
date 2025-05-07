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
                  eVSD – Blockchain sistem za sednice i glasanje
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Modernizacija i digitalizacija procesa VSD kroz bezbedan,
                  transparentan i decentralizovan sistem
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild>
                  <Link href="/login">Prijava sa kripto novčanikom</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/rezultati">Pregled javnih rezultata</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="w-full max-w-full px-4 md:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-12">
              Prednosti blockchain glasanja
            </h2>
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader>
                  <Wallet className="h-6 w-6 mb-2 text-blue-500" />
                  <CardTitle>Kripto novčanik za pristup</CardTitle>
                  <CardDescription>
                    Autentifikacija korisnika pomoću blockchain tehnologije
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Svaki fakultet koristi svoj jedinstveni kripto novčanik za
                    pristup sistemu i glasanje, obezbeđujući najviši nivo
                    sigurnosti i transparentnosti.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <FileCheck className="h-6 w-6 mb-2 text-blue-500" />
                  <CardTitle>Nepromenjivi zapisi</CardTitle>
                  <CardDescription>
                    Svi glasovi su trajno zabeleženi na blockchain-u
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Jednom kada se glas zabeleži na blockchain-u, ne može se
                    promeniti ili izbrisati, što garantuje integritet glasanja i
                    sprečava manipulacije.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Shield className="h-6 w-6 mb-2 text-blue-500" />
                  <CardTitle>Digitalna verifikacija</CardTitle>
                  <CardDescription>
                    Svaki glas se digitalno potpisuje pomoću novčanika
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Glasovi se beleže sa datumom, vremenom i digitalnim
                    potpisom, garantujući autentičnost i sprečavajući
                    zloupotrebe.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 bg-muted w-full">
        <div className="w-full max-w-full flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} eVSD. Sva prava zadržana.
          </p>
        </div>
      </footer>
    </div>
  );
}
