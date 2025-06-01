import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface MembershipAcceptanceProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const MembershipAcceptanceDialog: React.FC<
  MembershipAcceptanceProps
> = ({ isOpen, onAccept, onDecline }) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Добродошли у еВСД!
          </DialogTitle>
          <div className="flex justify-center my-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <DialogDescription className="text-center text-base">
            Честитамо! Ваша кандидатура за чланство у еВСД је успешно изгласана.
            Да бисте постали пуноправни члан, потребно је да прихватите чланство
            и правила организације.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-muted/30 rounded-lg border border-border/40 my-4">
          <h4 className="font-medium mb-2">Као члан еВСД имате право да:</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
              <span>Гласате о предлозима</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
              <span>Креирате нове предлоге</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
              <span>Учествујете у дискусијама</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
              <span>Предлажете нове чланове</span>
            </li>
          </ul>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onDecline} className="sm:w-full">
            Одбиј чланство
          </Button>
          <Button
            onClick={onAccept}
            className="sm:w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Прихватам чланство
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
