import { Copy, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VoteOption } from "@/types/proposal";
import { convertVoteOptionToString } from "@/lib/utils";

export interface ConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  chosenVote: VoteOption;
}
export function ConfirmVoteDialog({
  onConfirm,
  onCancel,
  chosenVote,
}: ConfirmDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          Потврдите глас
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Одабрали сте опцију &quot;{convertVoteOptionToString(chosenVote)}
            &quot;
          </DialogTitle>
          <DialogDescription>
            Изабрали сте опцију: &quot;{convertVoteOptionToString(chosenVote)}
            &quot; потврдите да је ово ваш коначан глас за овај предлог.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-600 flex items-center gap-2">
            <span>
              Након што потврдите глас више нећете моћи да га измените! Будите
              сигурни да је ово ваш коначан глас.
            </span>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button
              type="button"
              onClick={() => {
                onConfirm();
              }}
            >
              Потврди
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              type="button"
              onClick={() => {
                onCancel();
              }}
              variant="secondary"
            >
              Поништи
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
