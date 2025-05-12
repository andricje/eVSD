import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, ChevronRight, Info, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAnnouncements } from "@/context/announcements-context";
import { formatDate, convertAddressToName } from "@/lib/utils";
import { Announcement } from "@/types/announcements";
import { Skeleton } from "@/components/ui/skeleton";

export function FacultyAnnouncements() {
  const { announcements, isLoading } = useAnnouncements();
  const [sortedAnnouncements, setSortedAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    // Сортирамо обраћања по временском жигу, од најновијег ка најстаријем
    if (announcements.length > 0) {
      const sorted = [...announcements].sort((a, b) => b.timestamp - a.timestamp);
      setSortedAnnouncements(sorted);
    } else {
      setSortedAnnouncements([]);
    }
  }, [announcements]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground mb-2">Обавештења факултета</h2>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-4 bg-background border border-border/40 rounded-xl shadow-md">
            <div className="flex justify-between items-start mb-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-3" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (sortedAnnouncements.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground mb-2">Обавештења факултета</h2>
        <Alert className="bg-blue-50 border-blue-200 text-foreground">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle>Нема обавештења</AlertTitle>
          <AlertDescription>
            Тренутно нема активних обавештења факултета.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground mb-2">Обавештења факултета</h2>
      {sortedAnnouncements.map((announcement) => (
        <Card key={announcement.id} className="p-4 bg-background border border-border/40 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-indigo-500" />
              <h4 className="text-base font-medium text-foreground line-clamp-1">
                Обавештење факултета
              </h4>
            </div>
            <Badge variant="outline" className="text-xs px-2">
              {convertAddressToName(announcement.announcer)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3 whitespace-pre-line">
            {announcement.content}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(new Date(announcement.timestamp * 1000))}
            </span>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              Детаљније <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
} 