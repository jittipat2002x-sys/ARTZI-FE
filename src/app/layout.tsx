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
  title: "PetHeart",
  description: "ระบบบริหารจัดการคลินิกสัตวแพทย์",
  icons: {
    icon: "/heart-icon.png",
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
                if (saved) {
                  const data = JSON.parse(saved);
                  if (data.brandColor) {
                    document.documentElement.style.setProperty('--color-brand', data.brandColor);
                    
                    // Helper to adjust color for hover
                    const hex = data.brandColor.replace('#', '');
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
              {children}
            </BrandingProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
