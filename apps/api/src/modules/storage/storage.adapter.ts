export const STORAGE_ADAPTER = Symbol("STORAGE_ADAPTER");

export interface StorageObjectMetadata {
  objectKey: string;
  resolvedPath: string;
  sizeBytes: number;
}

export interface StorageAdapter {
  readonly driver: "local";
  resolveObjectKey(objectKey: string): string;
  exists(objectKey: string): Promise<boolean>;
  getMetadata(objectKey: string): Promise<StorageObjectMetadata | null>;
  getPublicUrl(objectKey: string | null | undefined): string | null;
}
