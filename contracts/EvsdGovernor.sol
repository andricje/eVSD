// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import { Governor } from "@openzeppelin/contracts/governance/Governor.sol";
import { GovernorCountingSimple } from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import { GovernorSettings } from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import { GovernorVotes } from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import { GovernorProposalGuardian } from "@openzeppelin/contracts/governance/extensions/GovernorProposalGuardian.sol";
import { IVotes } from "@openzeppelin/contracts/governance/utils/IVotes.sol";

contract EvsdGovernor is
  Governor,
  GovernorSettings,
  GovernorCountingSimple,
  GovernorVotes,
  GovernorProposalGuardian
{
  constructor(
    IVotes _token
  )
    Governor("EvsdGovernor")
    GovernorSettings(0 minutes, 15 minutes, 1e18)
    GovernorVotes(_token)
  {}

  function quorum(uint256 blockNumber) public pure override returns (uint256) {
    return 2e18;
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

  function doNothing() public pure {
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
  function _validateCancel(
    uint256 proposalId,
    address caller
  ) internal view override(Governor, GovernorProposalGuardian) returns (bool) {
    return super._validateCancel(proposalId, caller);
  }
}
