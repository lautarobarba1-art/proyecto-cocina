import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// In dev, Next.js uses eval() for source maps and HMR — 'unsafe-eval' is required.
// In production, the compiled bundle doesn't need it.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

// In dev, webpack HMR connects to localhost via websocket.
const connectSrc = isDev
  ? "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:* http://localhost:*"
  : "connect-src 'self' https://*.supabase.co wss://*.supabase.co";

const csp = [
  "default-src 'self'",
  scriptSrc,
  // Tailwind and Next.js inject inline styles at runtime
  "style-src 'self' 'unsafe-inline'",
  // next/font/google self-hosts fonts at build time — no external font CDN needed
  "font-src 'self'",
  // Images: Next.js image optimizer (blob:), placeholder shimmer (data:), and remote hosts
  "img-src 'self' data: blob: https://images.unsplash.com https://unsplash.com https://i.imgur.com https://imgur.com https://ibb.co https://i.ibb.co",
  // Videos served from Vercel Blob Storage
  "media-src 'self' https://xy2d0bcoexo5mdxi.public.blob.vercel-storage.com",
  connectSrc,
  // Google Maps embed in ContactMap
  "frame-src https://www.google.com",
  // No plugins (Flash, Java applets, etc.)
  "object-src 'none'",
  // Prevents <base> tag injection attacks
  "base-uri 'self'",
  // All form submissions must go to same origin
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
      },
      {
        protocol: "https",
        hostname: "imgur.com",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "ibb.co",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
    ],
  },
};

export default nextConfig;