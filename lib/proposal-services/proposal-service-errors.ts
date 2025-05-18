// Thrown if someone who is not eligible to create proposals tries to make one
export class IneligibleProposerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IneligibleProposerError";

    Object.setPrototypeOf(this, IneligibleProposerError.prototype);
  }
}
// Thrown if an ineligible voter tries to vote
export class IneligibleVoterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IneligibleVoterError";

    Object.setPrototypeOf(this, IneligibleVoterError.prototype);
  }
}
// Thrown if an identical proposal already exists
export class DuplicateProposalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateProposalError";

    Object.setPrototypeOf(this, DuplicateProposalError.prototype);
  }
}
