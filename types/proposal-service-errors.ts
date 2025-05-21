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
  constructor(message: string) {
    super(message);
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
