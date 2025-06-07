export class BlockchainError extends Error {
  readonly code: string;
  constructor(message: string) {
    super(message);
    this.code = new.target.name;
    Object.setPrototypeOf(this, BlockchainError.prototype);
  }
}

// Thrown if someone who is not eligible to create proposals tries to make one
export class IneligibleProposerError extends BlockchainError {
  constructor(proposerAddress: string) {
    super(
      `Address: ${proposerAddress} is not eligible to create proposals (insufficient token balance)`
    );
    Object.setPrototypeOf(this, IneligibleProposerError.prototype);
  }
}
// Thrown if an ineligible voter tries to vote
export class IneligibleVoterError extends BlockchainError {
  constructor(address: string) {
    super(`Address ${address} is not eligible to vote!`);
    Object.setPrototypeOf(this, IneligibleVoterError.prototype);
  }
}
// Thrown if an identical proposal already exists
export class DuplicateProposalError extends BlockchainError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, DuplicateProposalError.prototype);
  }
}
// Thrown if execute fails for some reason
export class ExecuteFailedError extends BlockchainError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ExecuteFailedError.prototype);
  }
}
// Thrown if a file listed in a proposal is not
export class FileNotFound extends BlockchainError {
  constructor(digestHex: string) {
    super(`File with digest hex: ${digestHex} could not be found`);
    Object.setPrototypeOf(this, FileNotFound.prototype);
  }
}
// Thrown if proposal parse fails
export class ProposalParseError extends BlockchainError {
  constructor(proposalId: string, message: string) {
    super(
      `Failed to parse proposal with id: ${proposalId} parsing failed with error: ${message}`
    );
    Object.setPrototypeOf(this, ProposalParseError.prototype);
  }
}
