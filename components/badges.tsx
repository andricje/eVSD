import { Badge } from "@/components/ui/badge";
import { getRemainingTime } from "@/lib/utils";
import { VoteOption } from "@/types/proposal";
import { CheckCircle2, MinusCircle, Timer, XCircle } from "lucide-react";

export const VoteBadge = ({ vote }: { vote: VoteOption }) => {
  if (vote === "for") {
    return <Badge className="bg-green-500">Za</Badge>;
  } else if (vote === "against") {
    return <Badge className="bg-red-500">Protiv</Badge>;
  } else {
    return <Badge variant="outline">Uzdržan</Badge>;
  }
};

export const VoteIcon = ({ vote }: { vote: VoteOption }) => {
  if (vote === "for") {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  } else if (vote === "against") {
    return <XCircle className="h-4 w-4 text-red-500" />;
  } else {
    return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

export const StatusBadge = ({
  status,
  expiresAt,
}: {
  status: string;
  expiresAt?: Date;
}) => {
  if (status === "closed") {
    return <Badge className="bg-green-500">Zatvoreno</Badge>;
  } else if (status === "expired") {
    return <Badge className="bg-gray-500">Isteklo</Badge>;
  } else if (status === "expiring" && expiresAt) {
    return (
      <Badge className="bg-amber-500">
        <Timer className="h-3 w-3 mr-1" />
        Ističe za {getRemainingTime(expiresAt)}
      </Badge>
    );
  } else {
    return <Badge className="bg-blue-500">Aktivno</Badge>;
  }
};
