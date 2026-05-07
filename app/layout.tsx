import type { Metadata } from "next";
import { Cinzel, Montserrat } from "next/font/google";
import "./globals.css";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

/**
 * Tipografías oficiales del manual (v2):
 *   - Montserrat (300-900) → todo el sistema sans-serif (display, body, eyebrow, meta).
 *   - Cinzel (400-600)     → slogan & detalles editoriales (sustituto web de Copperplate).
 *
 * Nota: el wordmark "Menesteres" usa Nersans Two (sin licencia web) y SIEMPRE
 * se renderiza como imagen, no como texto CSS. Ver components/brand/Logotype.tsx.
 */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Menesteres",
  description: "Escuela de cocina en Rafaela, Santa Fe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body text-carbon">
        <Navbar />
        {children}
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
