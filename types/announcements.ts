export interface Announcement {
  id: string;             // ID obraćanja (odgovara brojaču u ugovoru)
  content: string;        // Sadržaj obraćanja
  announcer: string;      // Adresa ili ime onoga ko je objavio obraćanje
  timestamp: number;      // Vreme kreiranja obraćanja (UNIX timestamp)
  isActive: boolean;      // Da li je obraćanje aktivno
}

export interface AnnouncementContextType {
  announcements: Announcement[];
  unseenAnnouncements: Announcement[];
  markAnnouncementAsSeen: (announcementId: string) => void;
  isLoading: boolean;
} 