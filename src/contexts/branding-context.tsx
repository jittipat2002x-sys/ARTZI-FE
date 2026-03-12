'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from '@/contexts/theme-context';
import { usePathname } from 'next/navigation';
import { useBrandingSync } from '@/hooks/use-global-data';

interface BrandingContextType {
  brandColor: string;
  brandColorDark: string;
  brandColorLight: string;
  logoUrl: string | null;
  tenantName: string | null;
  branchName: string | null;
  isInitialLoading: boolean;
  setBrandColor: (color: string) => void;
  setBrandColorDark: (color: string) => void;
  setLogoUrl: (url: string | null) => void;
  setBranchName: (name: string | null) => void;
  updateBranding: (color: string, colorDark: string, logo: string | null) => void;
  resetBranding: () => void;
}

const DEFAULT_BRAND_COLOR = '#006837';

  // Helper functions for initial static logic if needed
  // ...

const BrandingContext = createContext<BrandingContextType>({
  brandColor: DEFAULT_BRAND_COLOR,
  brandColorDark: DEFAULT_BRAND_COLOR,
  brandColorLight: DEFAULT_BRAND_COLOR,
  logoUrl: null,
  tenantName: null,
  branchName: null,
  isInitialLoading: true,
  setBrandColor: () => {},
  setBrandColorDark: () => {},
  setLogoUrl: () => {},
  setBranchName: () => {},
  updateBranding: () => {},
  resetBranding: () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [brandColor, setBrandColorState] = useState(DEFAULT_BRAND_COLOR);
  const [brandColorDark, setBrandColorDarkState] = useState(DEFAULT_BRAND_COLOR);
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [branchName, setBranchNameState] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [hasTenant, setHasTenant] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.tenantId) setHasTenant(true);
      } catch {}
    }
  }, []);

  const { data: serverBranding, isLoading: isSyncing } = useBrandingSync(hasTenant);

  // Load initial branding from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('branding');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.brandColor) {
          setBrandColorState(data.brandColor);
          applyBrandColor(data.brandColor, false);
        }
        if (data.brandColorDark) {
          setBrandColorDarkState(data.brandColorDark);
          applyBrandColor(data.brandColorDark, true);
        } else if (data.brandColor) {
           // Fallback for older saved data
          setBrandColorDarkState(data.brandColor);
          applyBrandColor(data.brandColor, true);
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
      const colorDark = serverBranding.brandColorDark || color;
      const logo = serverBranding.logoUrl || null;
      if (color) {
        setBrandColorState(color);
        applyBrandColor(color, false);
      }
      if (colorDark) {
        setBrandColorDarkState(colorDark);
        applyBrandColor(colorDark, true);
      }
      setLogoUrlState(logo);
      saveBranding(color, colorDark, logo);
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

  const applyBrandColor = React.useCallback((color: string, isDark: boolean) => {
    // We set the specific variables
    const prefix = isDark ? '--color-brand-dark' : '--color-brand-light';
    document.documentElement.style.setProperty(prefix, color);
    const hoverColor = adjustColor(color, -15);
    document.documentElement.style.setProperty(`${prefix}-hover`, hoverColor);

    // If this is the active theme, also update the main --color-brand
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    if ((isDark && currentTheme === 'dark') || (!isDark && currentTheme === 'light')) {
      document.documentElement.style.setProperty('--color-brand', color);
      document.documentElement.style.setProperty('--color-brand-hover', hoverColor);
    }
  }, []);

  const saveBranding = React.useCallback((color: string, colorDark: string, logo: string | null) => {
    localStorage.setItem('branding', JSON.stringify({ 
      brandColor: color, 
      brandColorDark: colorDark,
      logoUrl: logo 
    }));
  }, []);

  const setBrandColor = React.useCallback((color: string) => {
    setBrandColorState(color);
    applyBrandColor(color, false);
    saveBranding(color, brandColorDark, logoUrl);
  }, [brandColorDark, logoUrl, applyBrandColor, saveBranding]);

  const setBrandColorDark = React.useCallback((color: string) => {
    setBrandColorDarkState(color);
    applyBrandColor(color, true);
    saveBranding(brandColor, color, logoUrl);
  }, [brandColor, logoUrl, applyBrandColor, saveBranding]);

  const setLogoUrl = React.useCallback((url: string | null) => {
    setLogoUrlState(url);
    saveBranding(brandColor, brandColorDark, url);
  }, [brandColor, brandColorDark, saveBranding]);

  const updateBranding = React.useCallback((color: string, colorDark: string, logo: string | null) => {
    setBrandColorState(color);
    setBrandColorDarkState(colorDark);
    setLogoUrlState(logo);
    applyBrandColor(color, false);
    applyBrandColor(colorDark, true);
    saveBranding(color, colorDark, logo);
  }, [applyBrandColor, saveBranding]);

  const resetBranding = React.useCallback(() => {
    setBrandColorState(DEFAULT_BRAND_COLOR);
    setBrandColorDarkState(DEFAULT_BRAND_COLOR);
    setLogoUrlState(null);
    applyBrandColor(DEFAULT_BRAND_COLOR, false);
    applyBrandColor(DEFAULT_BRAND_COLOR, true);
    localStorage.removeItem('branding');
  }, [applyBrandColor]);

  const setBranchName = React.useCallback((name: string | null) => {
    setBranchNameState(name);
  }, []);

  const activeBrandColor = React.useMemo(() => {
    return theme === 'dark' ? brandColorDark : brandColor;
  }, [theme, brandColor, brandColorDark]);

  // Sync active color when theme changes
  useEffect(() => {
    const hoverColor = adjustColor(activeBrandColor, -15);
    document.documentElement.style.setProperty('--color-brand', activeBrandColor);
    document.documentElement.style.setProperty('--color-brand-hover', hoverColor);
  }, [theme, activeBrandColor]);

  const contextValue = React.useMemo(() => ({
    brandColor: activeBrandColor,
    brandColorDark: brandColorDark,
    brandColorLight: brandColor,
    logoUrl,
    tenantName,
    branchName,
    isInitialLoading,
    setBrandColor,
    setBrandColorDark,
    setLogoUrl,
    setBranchName,
    updateBranding,
    resetBranding
  }), [activeBrandColor, brandColorDark, brandColor, logoUrl, tenantName, branchName, isInitialLoading, setBrandColor, setBrandColorDark, setLogoUrl, updateBranding, resetBranding]);

  return (
    <BrandingContext.Provider value={contextValue}>
      <div className={isInitialLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
        {children}
      </div>
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);
export { DEFAULT_BRAND_COLOR };
