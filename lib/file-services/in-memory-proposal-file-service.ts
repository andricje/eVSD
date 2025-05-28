import { ProposalFileService } from "../file-services/proposal-file-service";

export class InMemoryProposalFileService implements ProposalFileService {
  private files: Map<string, File> = new Map();

  async upload(file: File): Promise<string> {
    const digestString = await fileToDigestHex(file);
    this.files.set(digestString, file);
    return digestString;
  }
  async download(digestHex: string): Promise<File> {
    const file = this.files.get(digestHex);
    if (!file) {
      throw new Error("File not found");
    }
    return file;
  }
}
export async function fileToDigestHex(file: File) {
  const buffer = await window.crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer()
  );
  const hashArray = Array.from(new Uint8Array(buffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}
