'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface BrandingContextType {
  brandColor: string;
  logoUrl: string | null;
  setBrandColor: (color: string) => void;
  setLogoUrl: (url: string | null) => void;
  updateBranding: (color: string, logo: string | null) => void;
  resetBranding: () => void;
}

const DEFAULT_BRAND_COLOR = '#006837';

  // Helper functions for initial static logic if needed
  // ...

const BrandingContext = createContext<BrandingContextType>({
  brandColor: DEFAULT_BRAND_COLOR,
  logoUrl: null,
  setBrandColor: () => {},
  setLogoUrl: () => {},
  updateBranding: () => {},
  resetBranding: () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [brandColor, setBrandColorState] = useState(DEFAULT_BRAND_COLOR);
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);

  // Load initial branding from localStorage and server on mount
  useEffect(() => {
    // 1. Initial load from localStorage for speed
    const saved = localStorage.getItem('branding');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.brandColor) {
          setBrandColorState(data.brandColor);
          applyBrandColor(data.brandColor);
        }
        if (data.logoUrl) setLogoUrlState(data.logoUrl);
      } catch {}
    }

    // 2. Fetch from server to ensure sync
    const fetchBranding = async () => {
      try {
        const token = localStorage.getItem('token'); // or authService.getToken()
        if (!token) return;

        const res = await fetch('http://localhost:3100/api/tenants/my/branding', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          if (data.brandColor) {
            updateBranding(data.brandColor, data.logoUrl || null);
          }
        }
      } catch (err) {
        console.error('Failed to sync branding:', err);
      }
    };

    fetchBranding();
  }, []);

  // Sync document title with tenantName from auth if available
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.tenantName) {
          setTenantName(user.tenantName);
        }
      }
    } catch {}
  }, []);

  // Continuously force title and favicon on every route change (because Next.js soft-nav overwrites them)
  useEffect(() => {
    // Override Document Title
    const title = tenantName || 'Vet Dashboard';
    if (document.title !== title) {
      document.title = title;
    }

    // Override Favicon
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = logoUrl || '/favicon.ico';
  }, [pathname, tenantName, logoUrl]);

  function applyBrandColor(color: string) {
    document.documentElement.style.setProperty('--color-brand', color);
    // Generate a slightly darker hover color
    const hoverColor = adjustColor(color, -15);
    document.documentElement.style.setProperty('--color-brand-hover', hoverColor);
  }

  function adjustColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
  }

  function setBrandColor(color: string) {
    setBrandColorState(color);
    applyBrandColor(color);
    saveBranding(color, logoUrl);
  }

  function setLogoUrl(url: string | null) {
    setLogoUrlState(url);
    saveBranding(brandColor, url);
  }

  function saveBranding(color: string, logo: string | null) {
    localStorage.setItem('branding', JSON.stringify({ brandColor: color, logoUrl: logo }));
  }

  function updateBranding(color: string, logo: string | null) {
    setBrandColorState(color);
    setLogoUrlState(logo);
    applyBrandColor(color);
    saveBranding(color, logo);
  }

  function resetBranding() {
    setBrandColorState(DEFAULT_BRAND_COLOR);
    setLogoUrlState(null);
    applyBrandColor(DEFAULT_BRAND_COLOR);
    localStorage.removeItem('branding');
  }

  return (
    <BrandingContext.Provider value={{ brandColor, logoUrl, setBrandColor, setLogoUrl, updateBranding, resetBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);
export { DEFAULT_BRAND_COLOR };
