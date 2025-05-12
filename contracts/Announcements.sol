// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Definišemo strukturu za obraćanje
struct Announcement {
    address announcer;
    string content;
    uint256 timestamp;
    bool isActive; // Da znamo da li je obraćanje aktivno/vidljivo
}

contract Announcements is Ownable {
    // Mapiranje za čuvanje obraćanja i brojač
    mapping(uint256 => Announcement) public announcements;
    uint256 public announcementCounter;

    // Događaj za kreiranje obraćanja
    event AnnouncementCreated(
        uint256 indexed announcementId,
        address indexed announcer,
        string content,
        uint256 timestamp
    );

    // Događaj za deaktiviranje obraćanja
    event AnnouncementDeactivated(uint256 indexed announcementId);

    constructor(address initialOwner) Ownable(initialOwner) {}

    // Funkcija za kreiranje novog obraćanja - uklonjen onlyOwner modifikator
    function createAnnouncement(string calldata content) public {
        announcements[++announcementCounter] = Announcement({
            announcer: msg.sender,
            content: content,
            timestamp: block.timestamp,
            isActive: true
        });
        emit AnnouncementCreated(announcementCounter, msg.sender, content, block.timestamp);
    }

    // Funkcija za deaktiviranje obraćanja - korisnik može deaktivirati samo svoja obraćanja
    function deactivateAnnouncement(uint256 announcementId) public {
        require(announcements[announcementId].timestamp != 0, "Announcement does not exist");
        require(announcements[announcementId].isActive, "Announcement is already inactive");
        
        // Samo kreator obraćanja ili vlasnik ugovora može deaktivirati obraćanje
        require(
            announcements[announcementId].announcer == msg.sender || owner() == msg.sender,
            "Only announcer or owner can deactivate"
        );
        
        announcements[announcementId].isActive = false;
        emit AnnouncementDeactivated(announcementId);
    }

    // Funkcija za dobijanje aktivnih obraćanja
    function getActiveAnnouncements() public view returns (Announcement[] memory) {
        uint activeCount = 0;
        for (uint i = 1; i <= announcementCounter; i++) {
            if (announcements[i].isActive) {
                activeCount++;
            }
        }

        Announcement[] memory activeAnnouncementsList = new Announcement[](activeCount);
        uint currentIndex = 0;
        for (uint i = 1; i <= announcementCounter; i++) {
            if (announcements[i].isActive) {
                activeAnnouncementsList[currentIndex++] = announcements[i];
            }
        }
        return activeAnnouncementsList;
    }
} 