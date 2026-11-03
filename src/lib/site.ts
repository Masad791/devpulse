// Absolute site URL for RSS, share images and metadata. Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically.
export const SITE_URL =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
