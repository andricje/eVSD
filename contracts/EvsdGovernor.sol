// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract EvsdGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, Ownable {
    // Broj registrovanih adresa koje imaju pristup
    uint256 public totalVoters;
    
    // Mapa adresa koje imaju pravo glasa
    mapping(address => bool) public hasVotingRights;
    
    // Događaj za praćenje registracije glasača
    event VoterRegistered(address indexed voter);
    event VoterRemoved(address indexed voter);

    constructor(IVotes _token, address initialOwner)
        Governor("EvsdGovernor")
        GovernorSettings(0 minutes, 1 days, 1e18)
        GovernorVotes(_token)
        Ownable(initialOwner)
    {
        totalVoters = 0;
    }

    // Funkcija za registraciju novog glasača
    function registerVoter(address voter) public onlyOwner {
        require(!hasVotingRights[voter], "Voter already registered");
        hasVotingRights[voter] = true;
        totalVoters++;
        emit VoterRegistered(voter);
    }
    
    // Funkcija za uklanjanje glasača
    function removeVoter(address voter) public onlyOwner {
        require(hasVotingRights[voter], "Voter not registered");
        hasVotingRights[voter] = false;
        totalVoters--;
        emit VoterRemoved(voter);
    }

    // Funkcija za računanje kvoruma - 50% + 1 od ukupnog broja glasača
    function quorum(uint256) public view override returns (uint256) {
        if (totalVoters == 0) {
            return 1e18; // Default vrednost ako nema registrovanih glasača
        }
        
        // 50% + 1 = (totalVoters / 2) + 1
        uint256 minimumVoters = (totalVoters / 2) + 1;
        
        // Vraćamo broj glasova potreban za kvorum (1 token = 1 glas)
        return minimumVoters * 1e18;
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
}