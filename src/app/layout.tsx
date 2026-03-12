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

import { GlobalSpinner } from "@/components/ui/global-spinner";

export const metadata: Metadata = {
  title: "PetHeart",
  description: "ระบบบริหารจัดการคลินิกสัตวแพทย์",
  icons: {
    icon: "/img/image__1_-removebg-preview.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('branding');
                const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (saved) {
                  const data = JSON.parse(saved);
                  const color = theme === 'dark' ? (data.brandColorDark || data.brandColor) : data.brandColor;
                  
                  if (color) {
                    document.documentElement.style.setProperty('--color-brand', color);
                    
                    // Helper to adjust color for hover
                    const hex = color.replace('#', '');
                    const num = parseInt(hex, 16);
                    const amount = -15;
                    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
                    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
                    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
                    const hoverColor = "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
                    
                    document.documentElement.style.setProperty('--color-brand-hover', hoverColor);
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anuphan.variable} ${kanit.variable} ${mitr.variable} antialiased font-anuphan`}
      >
        <ReactQueryProvider>
          <ThemeProvider>
            <BrandingProvider>
              <GlobalSpinner />
              {children}
            </BrandingProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
