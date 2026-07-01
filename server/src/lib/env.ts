import * as dotenv from "dotenv";
import path from "path";

// Load .env from the server root regardless of cwd
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT || "4000", 10),
  JWT_SECRET: required("JWT_SECRET"),
  APP_URL: process.env.APP_URL || "http://localhost:5180",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
  ADMIN_NAME: process.env.ADMIN_NAME || "Admin",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "465", 10),
  SMTP_SECURE: (process.env.SMTP_SECURE || "true") === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  MAIL_FROM: process.env.MAIL_FROM || "",
};
