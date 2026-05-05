export interface Env {
  SESSION_SECRET: string;
  GA_ID?: string;
  S3_ENDPOINT?: string;
  S3_REGION: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
  S3_BUCKET: string;
  S3_PUBLIC_URL_BASE: string;
  S3_FORCE_PATH_STYLE: boolean;
  DB_PATH: string;
}

export function loadEnv(): Env {
  const required = (name: string): string => {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
  };
  return {
    SESSION_SECRET: required("SESSION_SECRET"),
    GA_ID: process.env.GA_ID || undefined,
    S3_ENDPOINT: process.env.S3_ENDPOINT || undefined,
    S3_REGION: process.env.S3_REGION ?? "us-east-1",
    S3_ACCESS_KEY_ID: required("S3_ACCESS_KEY_ID"),
    S3_SECRET_ACCESS_KEY: required("S3_SECRET_ACCESS_KEY"),
    S3_BUCKET: required("S3_BUCKET"),
    S3_PUBLIC_URL_BASE: required("S3_PUBLIC_URL_BASE"),
    S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE === "true",
    DB_PATH: process.env.DB_PATH ?? "./data/myblog.db",
  };
}
