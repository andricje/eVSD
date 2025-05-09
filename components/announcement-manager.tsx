"use client";

import { useEffect } from "react";
import { useAnnouncements } from "@/context/announcements-context";
import { AnnouncementPopup } from "./announcement-popup";
import { useBrowserSigner } from "@/hooks/use-browser-signer";

export function AnnouncementManager() {
  const { unseenAnnouncements, markAnnouncementAsSeen } = useAnnouncements();
  const { signer } = useBrowserSigner();
  
  // Samo prikazujemo pop-up ako je korisnik ulogovan i ima nepročitanih obraćanja
  if (!signer || unseenAnnouncements.length === 0) {
    return null;
  }
  
  return (
    <AnnouncementPopup
      announcements={unseenAnnouncements}
      onClose={markAnnouncementAsSeen}
    />
  );
} 