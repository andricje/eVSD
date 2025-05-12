"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import {
  AlertCircle,
  CheckCircle2,
  HandCoins,
  ImageUp,
  Info,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CountryCombobox } from "./country-combobox";
import { Donation, Donor, testDonations, testDonors } from "@/types/donors";

const predefinedAmounts = {
  RSD: [600, 1200, 2400, 6000, 12000, 24000],
  USD: [5, 10, 20, 50, 100, 200],
  EUR: [5, 10, 20, 50, 100, 200],
};

const predefinedColors = [
  "bg-blue-400",
  "bg-orange-400",
  "bg-red-400",
  "bg-violet-400",
];

export function NewDonationDialog() {
  const [donationSubmitted, setDonationSubmitted] = useState(false);
  const [donationAmount, setDonationAmount] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<
    "RSD" | "USD" | "EUR"
  >("RSD");
  const [checkedDonorData, setCheckedDonorData] = useState<string | boolean>(
    false
  );
  const [donorName, setDonorName] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("bg-blue-400");
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Постављање износа на неку од предефинисаних вредности
  const handleAmountClick = (amount: number) => {
    setDonationAmount(amount.toString());
  };

  // Ресетовање форма на затварање диалог прозора
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDonationAmount("");
      setCheckedDonorData(false);
      setDonorName("");
      setSelectedColor("");
      setImageBase64(null);
      setSelectedColor("bg-blue-400");
    }
  };

  // "Уплоад слике" - узимање Басе64 адресе за приказ слике у локалној меморији
  // ТОДО: Логика за чување фајлова (може се повезати са постојећом логиком за Нови предлог)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Прослеђивање донације
  const handleSubmitDonation = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!donationAmount.trim()) {
      setError("Износ донације је обавезан.");
      return;
    }

    if (isNaN(+donationAmount)) {
      setError("Погрешан формат износа донација.");
      return;
    }

    // Провере ако се приказују подаци о донору
    if (checkedDonorData) {
      if (!donorName.trim()) {
        setError("Назив донора је обавезан.");
        return;
      }
      if (!selectedCountry.trim()) {
        setError("Држава донора је обавезна.");
        return;
      }
      if (!selectedColor.trim()) {
        setError("Боја је обавезна.");
        return;
      }

      const newDonor = {
        id: 11n,
        walletAddress: "0xx79824...",
        name: donorName,
        avatar: imageBase64,
        color: selectedColor,
        countryCode: selectedCountry.toLowerCase(),
        anonymous: !checkedDonorData,
        avatarApproved: true,
      };
      testDonors.push(newDonor);
      const newDonation = {
        id: 11n,
        donor: newDonor,
        dateTime: new Date(),
        amount: +donationAmount,
      };
      testDonations.push(newDonation);
    }

    setLoading(true);
    setInfoMessage("Обрађивање донације...");

    // ... Обрада новчаника, паметног уговора, конверзија новца...

    setLoading(false);
    setDonationSubmitted(true);
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <HandCoins className="h-4 w-4 mr-2" />
          Донирај
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Донирајте средства</DialogTitle>
          <DialogDescription>
            Попуните формулар за донирање средстава еВСД платформи.
          </DialogDescription>
        </DialogHeader>
        {donationSubmitted ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Хвала!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Ваша донација је успешно евидентирана у систему.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-red-600 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium">Грешка</h3>
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {infoMessage && !error && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-blue-600 flex items-start gap-2">
                <Info className="h-5 w-5 mt-0.5" />
                <div>
                  <h3 className="font-medium">Обрада</h3>
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {infoMessage}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitDonation} className="space-y-6 mt-4">
              <div className="grid grid-cols-3 gap-2">
                {predefinedAmounts[selectedCurrency].map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    className={cn(
                      "text-sm",
                      donationAmount === amount.toString() && "border-primary"
                    )}
                    onClick={() => handleAmountClick(amount)}
                  >
                    {amount} {selectedCurrency}
                  </Button>
                ))}
              </div>

              <div className="relative">
                <Input
                  type="number"
                  placeholder="Износ"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="pr-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <Select
                    value={selectedCurrency}
                    onValueChange={(val) =>
                      setSelectedCurrency(val as "RSD" | "USD" | "EUR")
                    }
                  >
                    <SelectTrigger className="w-[80px] border-none h-2">
                      <SelectValue placeholder="Валута" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RSD">RSD</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  onCheckedChange={(checked) => {
                    setCheckedDonorData(checked);
                  }}
                  id="anonymous"
                />
                <label
                  htmlFor="anonymous"
                  className="text-sm font-medium leading-none"
                >
                  Прикажи податке о донацији
                </label>
              </div>

              {checkedDonorData && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Име/назив донора</Label>
                    <Input
                      id="title"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="Унесите назив донора"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Држава</Label>
                    <CountryCombobox onSelect={setSelectedCountry} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Аватар</Label>
                    <Label htmlFor="avatar">
                      {imageBase64 ? (
                        <img
                          src={imageBase64}
                          alt="Preview"
                          className="size-12 rounded-full object-contain cursor-pointer"
                        />
                      ) : (
                        <>
                          <Label
                            htmlFor="avatar"
                            className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted"
                          >
                            <ImageUp className="h-4 w-4" />
                            <span>Изаберите слику</span>
                          </Label>
                        </>
                      )}
                    </Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="color">Боја</Label>
                    <div className="flex flex-row gap-3">
                      {predefinedColors.map((color) => (
                        <div
                          key={color}
                          onClick={() => {
                            setSelectedColor(color);
                          }}
                          className={`${color} size-8 rounded-full cursor-pointer border-2
                            ${selectedColor === color ? "border-blue-900" : "border-transparent"}
                          `}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Обрада..." : "Потврди донацију"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
