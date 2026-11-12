import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { AppConfigValues } from "../../config/env.schema";
import type { StorageAdapter, StorageObjectMetadata } from "./storage.adapter";

@Injectable()
export class S3StorageAdapter implements StorageAdapter {
  readonly driver = "s3" as const;
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicDomain?: string;

  constructor(
    @Optional()
    private readonly configService?: ConfigService<AppConfigValues, true>,
  ) {
    const endpoint = this.configService?.get("S3_ENDPOINT", { infer: true });
    const region =
      this.configService?.get("S3_REGION", { infer: true }) || "auto";
    const accessKeyId = this.configService?.get("S3_ACCESS_KEY_ID", {
      infer: true,
    });
    const secretAccessKey = this.configService?.get("S3_SECRET_ACCESS_KEY", {
      infer: true,
    });
    const bucket = this.configService?.get("S3_BUCKET_NAME", { infer: true });
    this.publicDomain = this.configService?.get("S3_PUBLIC_DOMAIN", {
      infer: true,
    });

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        "S3 configuration (endpoint, bucket, accessKey, secretKey) is incomplete.",
      );
    }

    this.bucketName = bucket;
    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  resolveObjectKey(objectKey: string): string {
    return objectKey.replace(/^\/+/, "");
  }

  async exists(objectKey: string): Promise<boolean> {
    const meta = await this.getMetadata(objectKey);
    return meta !== null;
  }

  async getMetadata(objectKey: string): Promise<StorageObjectMetadata | null> {
    const key = this.resolveObjectKey(objectKey);
    try {
      const res = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      return {
        objectKey,
        resolvedPath: `s3://${this.bucketName}/${key}`,
        sizeBytes: res.ContentLength ?? 0,
        mimeType: res.ContentType,
      };
    } catch {
      return null;
    }
  }

  getPublicUrl(objectKey: string | null | undefined): string | null {
    if (!objectKey) return null;
    const key = this.resolveObjectKey(objectKey);
    if (this.publicDomain) {
      const base = this.publicDomain.replace(/\/+$/, "");
      return `${base}/${key}`;
    }
    return `/${key}`;
  }

  async putObject(
    objectKey: string,
    data: Buffer,
    mimeType?: string,
  ): Promise<void> {
    const key = this.resolveObjectKey(objectKey);
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: data,
        ContentType: mimeType || "application/octet-stream",
      }),
    );
  }

  async getObject(objectKey: string): Promise<Buffer | null> {
    const key = this.resolveObjectKey(objectKey);
    try {
      const res = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      if (!res.Body) return null;
      const chunks: Uint8Array[] = [];
      for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
  }

  async deleteObject(objectKey: string): Promise<void> {
    const key = this.resolveObjectKey(objectKey);
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }

  async getPresignedUploadUrl(
    objectKey: string,
    mimeType: string,
    expiresInSeconds: number = 900,
  ): Promise<string> {
    const key = this.resolveObjectKey(objectKey);
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }
}
