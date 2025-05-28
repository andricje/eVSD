import { ProposalFileService } from "../file-services/proposal-file-service";

export class PinataProposalFileService implements ProposalFileService {
  async upload(file: File): Promise<string> {
    try {
      const data = new FormData();
      data.set("file", file);
      const uploadRequest = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      const cid = await uploadRequest.json();
      return cid;
    } catch {
      throw new Error("Failed to upload file to Pinata");
    }
  }

  async download(cid: string): Promise<File> {
    const fetchRequest = await fetch(`/api/files?cid=${cid}`);
    if (!fetchRequest.ok) {
      throw new Error("Failed to fetch file from Pinata");
    }
    const blob = await fetchRequest.blob();
    const file = new File([blob], cid, { type: blob.type });
    return file;
  }
}
