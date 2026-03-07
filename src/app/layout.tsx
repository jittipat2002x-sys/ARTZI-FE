import type { Metadata } from "next";
import { Geist, Geist_Mono, Anuphan, Kanit, Mitr } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/theme-context";
import { BrandingProvider } from "@/contexts/branding-context";
import { ReactQueryProvider } from "@/providers/react-query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const mitr = Mitr({
  variable: "--font-mitr",
  subsets: ["latin", "thai"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vet Dashboard",
  description: "ระบบบริหารจัดการคลินิกสัตวแพทย์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anuphan.variable} ${kanit.variable} ${mitr.variable} antialiased font-anuphan`}
      >
        <ReactQueryProvider>
          <ThemeProvider>
            <BrandingProvider>
              {children}
            </BrandingProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
