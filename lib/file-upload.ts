type FileDigest = ArrayBuffer;

export interface ProposalFileService {
  upload: (file: File) => Promise<string>;
  fetch: (hexDigest: string) => Promise<File>;
}

class InMemoryProposalFileService implements ProposalFileService {
  private files: Map<string, File> = new Map();

  async upload(file: File): Promise<string> {
    const digest = await window.crypto.subtle.digest(
      "SHA-256",
      await file.arrayBuffer()
    );
    const digestString = this.DigestToHex(digest);
    this.files.set(digestString, file);
    return this.DigestToHex(digest);
  }
  async fetch(digestHex: string): Promise<File> {
    const file = this.files.get(digestHex);
    if (!file) {
      throw new Error("File not found");
    }
    return file;
  }
  private DigestToHex(hashBuffer: FileDigest): string {
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""); // convert bytes to hex string
    return hashHex;
  }
}
