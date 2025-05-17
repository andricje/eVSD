export class IneligibleProposerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IneligibleProposerError";

    Object.setPrototypeOf(this, IneligibleProposerError.prototype);
  }
}
export class IneligibleVoterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IneligibleVoterError";

    Object.setPrototypeOf(this, IneligibleVoterError.prototype);
  }
}
