export const STORAGE_ADAPTER = Symbol("STORAGE_ADAPTER");

export interface StorageObjectMetadata {
  objectKey: string;
  resolvedPath: string;
  sizeBytes: number;
  mimeType?: string;
}

export interface StorageAdapter {
  readonly driver: "local" | "s3";
  resolveObjectKey(objectKey: string): string;
  exists(objectKey: string): Promise<boolean>;
  getMetadata(objectKey: string): Promise<StorageObjectMetadata | null>;
  getPublicUrl(objectKey: string | null | undefined): string | null;
  putObject(objectKey: string, data: Buffer, mimeType?: string): Promise<void>;
  getObject(objectKey: string): Promise<Buffer | null>;
  deleteObject(objectKey: string): Promise<void>;
  getPresignedUploadUrl?(
    objectKey: string,
    mimeType: string,
    expiresInSeconds: number,
  ): Promise<string>;
}
