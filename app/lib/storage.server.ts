import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { Env } from "~/env.server";

export interface Storage {
  put(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export function createS3Storage(env: Env): Storage {
  const client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });

  return {
    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
      return `${env.S3_PUBLIC_URL_BASE.replace(/\/$/, "")}/${key}`;
    },
    async delete(key) {
      await client.send(
        new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key })
      );
    },
  };
}
