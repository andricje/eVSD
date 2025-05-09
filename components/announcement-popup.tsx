"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Info, ChevronRight } from "lucide-react";
import { Announcement } from "@/types/announcements";

interface AnnouncementPopupProps {
  announcements: Announcement[];
  onClose: (announcementId: string) => void;
}

export function AnnouncementPopup({ announcements, onClose }: AnnouncementPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(true);
  
  const currentAnnouncement = announcements[currentIndex];
  
  // Ako nema više obraćanja, zatvori pop-up
  useEffect(() => {
    if (announcements.length === 0) {
      setOpen(false);
    }
  }, [announcements]);

  const handleClose = () => {
    if (currentAnnouncement) {
      onClose(currentAnnouncement.id);
    }
    
    // Ako ima još obraćanja, pređi na sledeće
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Ako nema više obraćanja, zatvori pop-up
      setOpen(false);
    }
  };

  if (!currentAnnouncement) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={true}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-blue-50 p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 rounded-full p-2">
                <Info className="h-5 w-5 text-blue-700" />
              </div>
              <DialogTitle className="text-xl font-semibold text-blue-900">Obraćanje fakulteta</DialogTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose} 
              className="h-8 w-8 rounded-full hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-lg mb-6 leading-relaxed">
            {currentAnnouncement.content}
          </div>
          
          <div className="text-sm text-gray-500 pt-4 border-t flex justify-between items-center">
            <div>
              Objavio: <span className="font-medium">{currentAnnouncement.announcer}</span>
            </div>
            <div>
              {new Date(currentAnnouncement.timestamp).toLocaleDateString('sr-RS', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-b-lg border-t">
          {currentIndex < announcements.length - 1 ? (
            <Button 
              onClick={handleClose} 
              variant="default" 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <span>Sledeće obraćanje</span>
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleClose} 
              variant="default" 
              className="w-full bg-gray-800 hover:bg-gray-900"
            >
              Zatvori
            </Button>
          )}
          
          {announcements.length > 1 && (
            <div className="text-sm text-center mt-2 text-gray-500">
              {currentIndex + 1} od {announcements.length} obraćanja
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 