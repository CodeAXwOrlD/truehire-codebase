import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}. Check .env against .env.example.`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",

  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  databaseUrl: required("DATABASE_URL"),

  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "resumes",

  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",

  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 465),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  mailFrom: process.env.MAIL_FROM ?? "TrueHire <no-reply@example.com>",

  whatsappToken: process.env.WHATSAPP_TOKEN ?? "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  whatsappTemplateName: process.env.WHATSAPP_TEMPLATE_NAME ?? "",

  serviceSharedSecret: required("SERVICE_SHARED_SECRET"),
  scoringServiceUrl: process.env.SCORING_SERVICE_URL ?? "http://localhost:8000",
};
