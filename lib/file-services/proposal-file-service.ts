// TODO: Add more content types if needed
export const ALLOWED_CONTENT_TYPES = ["application/pdf"];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface ProposalFileService {
  upload: (file: File) => Promise<string>;
  download: (hexDigest: string) => Promise<File>;
}
