'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useBrandingSync } from '@/hooks/use-global-data';

interface BrandingContextType {
  brandColor: string;
  logoUrl: string | null;
  tenantName: string | null;
  branchName: string | null;
  isInitialLoading: boolean;
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
  tenantName: null,
  branchName: null,
  isInitialLoading: true,
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
  const [branchName, setBranchName] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { data: serverBranding, isLoading: isSyncing } = useBrandingSync();

  // Load initial branding from localStorage on mount
  useEffect(() => {
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
    setIsInitialLoading(false);
  }, []);

  // Sync state when server data changes
  useEffect(() => {
    if (serverBranding) {
      const color = serverBranding.brandColor;
      const logo = serverBranding.logoUrl || null;
      if (color) {
        setBrandColorState(color);
        applyBrandColor(color);
      }
      setLogoUrlState(logo);
      saveBranding(color, logo);
    }
  }, [serverBranding]);

  // Sync document title with tenantName from auth if available
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.tenantName) {
          setTenantName(user.tenantName);
        }
        if (user.branchName) {
          setBranchName(user.branchName);
        }
      }
    } catch {}
  }, []);

  // Continuously force title and favicon on every route change (because Next.js soft-nav overwrites them)
  useEffect(() => {
    // Override Document Title
    const title = tenantName || 'PetHeart';
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
    link.href = logoUrl || '/heart-icon.png';
  }, [pathname, tenantName, logoUrl]);

  const adjustColor = (hex: string, amount: number): string => {
    try {
      const num = parseInt(hex.replace('#', ''), 16);
      const r = Math.min(255, Math.max(0, (num >> 16) + amount));
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
      return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    } catch {
      return hex;
    }
  };

  const applyBrandColor = React.useCallback((color: string) => {
    document.documentElement.style.setProperty('--color-brand', color);
    const hoverColor = adjustColor(color, -15);
    document.documentElement.style.setProperty('--color-brand-hover', hoverColor);
  }, []);

  const saveBranding = React.useCallback((color: string, logo: string | null) => {
    localStorage.setItem('branding', JSON.stringify({ brandColor: color, logoUrl: logo }));
  }, []);

  const setBrandColor = React.useCallback((color: string) => {
    setBrandColorState(color);
    applyBrandColor(color);
    saveBranding(color, logoUrl);
  }, [logoUrl, applyBrandColor, saveBranding]);

  const setLogoUrl = React.useCallback((url: string | null) => {
    setLogoUrlState(url);
    saveBranding(brandColor, url);
  }, [brandColor, saveBranding]);

  const updateBranding = React.useCallback((color: string, logo: string | null) => {
    setBrandColorState(color);
    setLogoUrlState(logo);
    applyBrandColor(color);
    saveBranding(color, logo);
  }, [applyBrandColor, saveBranding]);

  const resetBranding = React.useCallback(() => {
    setBrandColorState(DEFAULT_BRAND_COLOR);
    setLogoUrlState(null);
    applyBrandColor(DEFAULT_BRAND_COLOR);
    localStorage.removeItem('branding');
  }, [applyBrandColor]);

  return (
    <BrandingContext.Provider value={{ brandColor, logoUrl, tenantName, branchName, isInitialLoading, setBrandColor, setLogoUrl, updateBranding, resetBranding }}>
      <div className={isInitialLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
        {children}
      </div>
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);
export { DEFAULT_BRAND_COLOR };
