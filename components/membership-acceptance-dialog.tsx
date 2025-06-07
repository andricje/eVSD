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
import { STRINGS } from "@/constants/strings"; // adjust import path if needed

interface MembershipAcceptanceProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const MembershipAcceptanceDialog: React.FC<
  MembershipAcceptanceProps
> = ({ isOpen, onAccept }) => {
  const strings = STRINGS.membershipAcceptance;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {strings.title}
          </DialogTitle>
          <div className="flex justify-center my-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <DialogDescription className="text-center text-base">
            {strings.description}
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-muted/30 rounded-lg border border-border/40 my-4">
          <h4 className="font-medium mb-2">{strings.rightsTitle}</h4>
          <ul className="space-y-2 text-sm">
            {strings.rightsList.map((item, idx) => (
              <li key={idx} className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onAccept}
            className="sm:w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {strings.accept}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
