type FileDigest = ArrayBuffer;

interface ProposalFileService {
  upload: (file: File) => Promise<FileDigest>;
  fetch: (digest: FileDigest) => Promise<File>;
}

class InMemoryProposalFileService implements ProposalFileService {
  private files: Map<FileDigest, File> = new Map();

  async upload(file: File): Promise<FileDigest> {
    const digest = await window.crypto.subtle.digest(
      "SHA-256",
      await file.arrayBuffer()
    );
    this.files.set(digest, file);
    return digest;
  }
  async fetch(digest: FileDigest): Promise<File> {
    const file = this.files.get(digest);
    if (!file) {
      throw new Error("File not found");
    }
    return file;
  }
}
