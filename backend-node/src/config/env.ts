import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}. Check .env against .env.example.`);
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
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

  supabaseUrl: optional("SUPABASE_URL"),
  supabaseServiceRoleKey: optional("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseStorageBucket: optional("SUPABASE_STORAGE_BUCKET", "resumes"),

  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtAccessExpiresIn: optional("JWT_ACCESS_EXPIRES_IN", "15m"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  jwtRefreshExpiresIn: optional("JWT_REFRESH_EXPIRES_IN", "7d"),

  smtpHost: optional("SMTP_HOST"),
  smtpPort: Number(process.env.SMTP_PORT ?? 465),
  smtpUser: optional("SMTP_USER"),
  smtpPass: optional("SMTP_PASS"),
  mailFrom: optional("MAIL_FROM", "TrueHire <no-reply@example.com>"),

  whatsappToken: optional("WHATSAPP_TOKEN"),
  whatsappPhoneNumberId: optional("WHATSAPP_PHONE_NUMBER_ID"),
  whatsappTemplateName: optional("WHATSAPP_TEMPLATE_NAME"),

  serviceSharedSecret: required("SERVICE_SHARED_SECRET"),
  scoringServiceUrl: optional("SCORING_SERVICE_URL", "http://localhost:8000"),

  // --- Optional: External Job Board API Keys ---
  // JSearch (RapidAPI) aggregates LinkedIn, Indeed, Glassdoor, ZipRecruiter
  // Free tier: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
  jsearchApiKey: optional("JSEARCH_API_KEY"),

  // FindWork.dev — quality developer roles (free registration required)
  // https://findwork.dev/api/
  findworkApiKey: optional("FINDWORK_API_KEY"),

  // Adzuna — global job board API (free tier, 250 req/day)
  // https://developer.adzuna.com/
  adzunaAppId: optional("ADZUNA_APP_ID"),
  adzunaApiKey: optional("ADZUNA_API_KEY"),
};
