export interface ProposalFileService {
  upload: (file: File) => Promise<string>;
  fetch: (hexDigest: string) => Promise<File>;
}

export class InMemoryProposalFileService implements ProposalFileService {
  private files: Map<string, File> = new Map();

  async upload(file: File): Promise<string> {
    const digestString = await fileToDigestHex(file);
    this.files.set(digestString, file);
    return digestString;
  }
  async fetch(digestHex: string): Promise<File> {
    const file = this.files.get(digestHex);
    if (!file) {
      throw new Error("File not found");
    }
    return file;
  }
}

export class PinataProposalFileService implements ProposalFileService {
  async upload(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/pinata-upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Failed to upload file to Pinata");
    }

    const data = await res.json();
    const ipfsHash = data.IpfsHash;

    console.log("Uploaded to IPFS:", ipfsHash);

    return ipfsHash;
  }

  async fetch(digestHex: string): Promise<File> {
    const response = await fetch(
      `https://gateway.pinata.cloud/ipfs/${digestHex}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch file from IPFS");
    }

    const blob = await response.blob();

    return new File([blob], digestHex);
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
