import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Megaphone, 
  ChevronRight, 
  Info, 
  Clock, 
  Search, 
  X, 
  Calendar, 
  Filter, 
  ChevronDown,
  ListFilter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAnnouncements } from "@/context/announcements-context";
import { formatDate, convertAddressToName } from "@/lib/utils";
import { Announcement } from "@/types/announcements";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Komponenta za prikaz detalja obaveštenja
function AnnouncementDetailsDialog({ announcement }: { announcement: Announcement }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
          Детаљније <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Megaphone className="h-5 w-5 text-indigo-600" />
            Обавештење факултета
          </DialogTitle>
          <DialogDescription>
            Објављено: {formatDate(new Date(announcement.timestamp * 1000))}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="px-2 py-1">
              {convertAddressToName(announcement.announcer)}
            </Badge>
          </div>
          <div className="whitespace-pre-line text-base mt-2">
            {announcement.content}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Komponenta za prikaz svih obaveštenja
function AllAnnouncementsDialog({ announcements }: { announcements: Announcement[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  
  // Grupisanje obaveštenja po datumu
  const groupByDate = (announcements: Announcement[]) => {
    const groups: Record<string, Announcement[]> = {};
    
    announcements.forEach(announcement => {
      const date = new Date(announcement.timestamp * 1000);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(announcement);
    });
    
    return groups;
  };
  
  // Filtriranje obaveštenja na osnovu pretrage
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAnnouncements(announcements);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = announcements.filter(announcement => 
        announcement.content.toLowerCase().includes(query) ||
        convertAddressToName(announcement.announcer).toLowerCase().includes(query)
      );
      setFilteredAnnouncements(filtered);
    }
  }, [searchQuery, announcements]);
  
  // Sortiranje i grupisanje obaveštenja
  const sortedAndGrouped = groupByDate(filteredAnnouncements.sort((a, b) => b.timestamp - a.timestamp));
  const dateKeys = Object.keys(sortedAndGrouped).sort((a, b) => b.localeCompare(a)); // Sortiranje po datumu (opadajući)
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          Прикажи све <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-4 border-b sticky top-0 bg-white z-10">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-indigo-600" />
            Сва обавештења факултета
          </DialogTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Претражи обавештења..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] p-4">
          <div className="space-y-6">
            {filteredAnnouncements.length === 0 ? (
              <div className="text-center py-12">
                <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Нема пронађених обавештења</p>
                <p className="text-muted-foreground mt-2">
                  Покушајте са другачијим терминима претраге
                </p>
              </div>
            ) : (
              dateKeys.map(dateKey => (
                <div key={dateKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <h3 className="font-medium">
                      {new Date(dateKey).toLocaleDateString('sr-RS', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </h3>
                  </div>
                  
                  <div className="space-y-3 ml-6">
                    {sortedAndGrouped[dateKey].map(announcement => (
                      <Card key={announcement.id} className="border shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="px-2">
                                {convertAddressToName(announcement.announcer)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(announcement.timestamp * 1000).toLocaleTimeString('sr-RS', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-sm line-clamp-3 whitespace-pre-line">
                              {announcement.content}
                            </p>
                            <AnnouncementDetailsDialog announcement={announcement} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Glavna komponenta za prikaz obaveštenja fakulteta
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
          <Card key={`skeleton-${index}`} className="p-4 bg-background border border-border/40 rounded-xl shadow-md">
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

  // Prikazujemo samo najnovija 3 obaveštenja u kartici
  const recentAnnouncements = sortedAnnouncements.slice(0, 3);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-foreground">Обавештења факултета</h2>
        <AllAnnouncementsDialog announcements={sortedAnnouncements} />
      </div>
      
      {recentAnnouncements.map((announcement, index) => (
        <Card 
          key={`announcement-${announcement.id}-${index}-${announcement.timestamp}`} 
          className="p-4 bg-background border border-border/40 rounded-xl shadow-md hover:shadow-lg transition-shadow"
        >
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
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3 whitespace-pre-line">
            {announcement.content}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(new Date(announcement.timestamp * 1000))}
            </span>
            <AnnouncementDetailsDialog announcement={announcement} />
          </div>
        </Card>
      ))}
      
      {sortedAnnouncements.length > 3 && (
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Приказано {recentAnnouncements.length} од {sortedAnnouncements.length} обавештења
          </p>
        </div>
      )}
    </div>
  );
} 