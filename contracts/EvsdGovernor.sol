// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Definišemo strukturu za obraćanje
struct Announcement {
    address announcer;
    string content;
    uint256 timestamp;
    bool isActive; // Da znamo da li je obraćanje aktivno/vidljivo
}

contract EvsdGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, Ownable {
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

    constructor(IVotes _token, address initialOwner)
        Governor("EvsdGovernor")
        GovernorSettings(0 minutes, 1 days, 1e18)
        GovernorVotes(_token)
        Ownable(initialOwner)
    {}

    function quorum(uint256 blockNumber) public pure override returns (uint256) {
        return 3e18;
    }

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function doNothing() public pure
    {
        return;
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    // Funkcija za kreiranje novog obraćanja
    function createAnnouncement(string calldata content) public onlyOwner {
        announcementCounter++;
        uint256 newAnnouncementId = announcementCounter;
        announcements[newAnnouncementId] = Announcement({
            announcer: msg.sender,
            content: content,
            timestamp: block.timestamp,
            isActive: true
        });
        emit AnnouncementCreated(newAnnouncementId, msg.sender, content, block.timestamp);
    }

    // Funkcija za deaktiviranje obraćanja (npr. da se ne prikazuje više)
    function deactivateAnnouncement(uint256 announcementId) public onlyOwner {
        require(announcements[announcementId].isActive, "Announcement is already inactive");
        require(announcements[announcementId].timestamp != 0, "Announcement does not exist"); // Provera da li obraćanje postoji
        announcements[announcementId].isActive = false;
        emit AnnouncementDeactivated(announcementId);
    }

    // Funkcija za dobijanje aktivnih obraćanja - primer, možda će trebati drugačiji pristup za frontend
    // Ovo je samo ilustracija, verovatno će frontend čitati događaje ili koristiti efikasniji način
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
                activeAnnouncementsList[currentIndex] = announcements[i];
                currentIndex++;
            }
        }
        return activeAnnouncementsList;
    }
}