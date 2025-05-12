"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Announcement, AnnouncementContextType } from "@/types/announcements";
import { getActiveAnnouncements, getDeployedContracts } from "@/lib/blockchain-utils";
import { useBrowserSigner } from "@/hooks/use-browser-signer";
import { Contract } from "ethers";

// Kreiranje konteksta sa inicijalnim vrednostima
const AnnouncementsContext = createContext<AnnouncementContextType | undefined>(undefined);

export function AnnouncementsProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unseenAnnouncements, setUnseenAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { signer } = useBrowserSigner();

  // Učitavanje viđenih obraćanja iz localStorage
  const getSeenAnnouncementIds = (): string[] => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("seenAnnouncements");
    return saved ? JSON.parse(saved) : [];
  };

  // Označavanje obraćanja kao viđenog
  const markAnnouncementAsSeen = (announcementId: string) => {
    const seenIds = getSeenAnnouncementIds();
    if (!seenIds.includes(announcementId)) {
      const updatedSeenIds = [...seenIds, announcementId];
      localStorage.setItem("seenAnnouncements", JSON.stringify(updatedSeenIds));
      
      // Ažuriramo stanje neviđenih obraćanja
      setUnseenAnnouncements(prev => 
        prev.filter(announcement => announcement.id !== announcementId)
      );
    }
  };

  // Filtriranje neviđenih obraćanja
  const filterUnseenAnnouncements = (allAnnouncements: Announcement[]) => {
    const seenIds = getSeenAnnouncementIds();
    return allAnnouncements.filter(announcement => !seenIds.includes(announcement.id));
  };

  // Pomoćna funkcija za obradu i deduplikaciju obraćanja
  const processAnnouncements = (fetchedAnnouncements: Announcement[]) => {
    // Kreiramo Map koristeći kompozitni ključ od ID + timestamp + announcer da izbegnemo duplikate
    const uniqueAnnouncementsMap = new Map<string, Announcement>();
    
    fetchedAnnouncements.forEach(announcement => {
      const uniqueKey = `${announcement.id}-${announcement.timestamp}-${announcement.announcer}`;
      uniqueAnnouncementsMap.set(uniqueKey, announcement);
    });
    
    // Vraćamo niz jedinstvenih obraćanja
    return Array.from(uniqueAnnouncementsMap.values());
  };

  useEffect(() => {
    if (!signer) {
      setIsLoading(false);
      return;
    }

    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true);
        const { announcements: announcementsContract } = getDeployedContracts(signer);
        const fetchedAnnouncements = await getActiveAnnouncements(announcementsContract);
        
        // Obradujemo obraćanja pre setovanja stanja
        const uniqueAnnouncements = processAnnouncements(fetchedAnnouncements);
        
        setAnnouncements(uniqueAnnouncements);
        setUnseenAnnouncements(filterUnseenAnnouncements(uniqueAnnouncements));
      } catch (error) {
        console.error("Greška pri dohvatanju obraćanja:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();

    // Postavka slušaoca za nova obraćanja
    const { announcements: announcementsContract } = getDeployedContracts(signer);
    const ethersAnnouncements = announcementsContract as unknown as Contract;
    
    // Slušanje novih kreiranja obraćanja
    ethersAnnouncements.on(
      ethersAnnouncements.filters.AnnouncementCreated,
      (announcementId, announcer, content, timestamp, event) => {
        const newAnnouncement: Announcement = {
          id: announcementId.toString(),
          announcer: announcer,
          content: content,
          timestamp: Number(timestamp),
          isActive: true,
        };
        
        // Provjeravamo da li već imamo ovo obraćanje pre dodavanja
        setAnnouncements(prev => {
          const exists = prev.some(a => 
            a.id === announcementId.toString() && 
            a.timestamp === Number(timestamp) && 
            a.announcer === announcer
          );
          
          if (exists) return prev;
          return [...prev, newAnnouncement];
        });
        
        setUnseenAnnouncements(prev => {
          const exists = prev.some(a => 
            a.id === announcementId.toString() && 
            a.timestamp === Number(timestamp) && 
            a.announcer === announcer
          );
          
          if (exists) return prev;
          return [...prev, newAnnouncement];
        });
      }
    );
    
    // Slušanje deaktiviranja obraćanja
    ethersAnnouncements.on(
      ethersAnnouncements.filters.AnnouncementDeactivated,
      (announcementId, event) => {
        const idToDeactivate = announcementId.toString();
        
        // Uklanjamo deaktivirana obraćanja iz obe liste
        setAnnouncements(prev => 
          prev.filter(a => a.id !== idToDeactivate)
        );
        setUnseenAnnouncements(prev => 
          prev.filter(a => a.id !== idToDeactivate)
        );
      }
    );

    return () => {
      ethersAnnouncements.removeAllListeners();
    };
  }, [signer]);

  return (
    <AnnouncementsContext.Provider 
      value={{ 
        announcements, 
        unseenAnnouncements, 
        markAnnouncementAsSeen, 
        isLoading 
      }}
    >
      {children}
    </AnnouncementsContext.Provider>
  );
}

export function useAnnouncements() {
  const context = useContext(AnnouncementsContext);
  if (context === undefined) {
    throw new Error("useAnnouncements mora biti korišćen unutar AnnouncementsProvider-a");
  }
  return context;
} 