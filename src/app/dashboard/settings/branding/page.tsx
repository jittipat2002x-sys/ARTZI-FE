'use client';

import React, { useEffect, useState, useRef } from 'react';
import { brandingService } from '@/services/admin.service';
import { useBranding, DEFAULT_BRAND_COLOR } from '@/contexts/branding-context';
import { Palette, Upload, RotateCcw, Check } from 'lucide-react';
import { BrandInput } from '@/components/ui/brand-input';

const PRESET_COLORS = [
  '#006837', '#0ea5e9', '#8b5cf6', '#ec4899', '#f97316',
  '#ef4444', '#14b8a6', '#6366f1', '#f59e0b', '#10b981',
  '#3b82f6', '#d946ef', '#84cc16', '#f43f5e', '#06b6d4',
];

export default function BrandingPage() {
  const { brandColor, logoUrl, setBrandColor, setLogoUrl, resetBranding } = useBranding();
  const [color, setColor] = useState(brandColor);
  const [logo, setLogo] = useState<string | null>(logoUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFetchedRef = useRef(false);

  // Sync local state when context values change (e.g. after background sync)
  useEffect(() => {
    if (brandColor) setColor(brandColor);
    if (logoUrl) setLogo(logoUrl);
  }, [brandColor, logoUrl]);

  useEffect(() => {
    // We still keep a fetch here just in case, or we can rely on context.
    // Let's rely on context and just show loading if context is at default maybe?
    // Actually, keeping the fetch for initial page load is fine but let's make it update the context too.
    const syncFromServer = async () => {
      try {
        const data = await brandingService.get();
        if (data.brandColor) {
          // This will trigger the [brandColor, logoUrl] effect above
          setBrandColor(data.brandColor);
        }
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
        }
      } catch (e) {
        console.error('Failed to load branding in page:', e);
      } finally {
        setLoading(false);
      }
    };

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    syncFromServer();
  }, [setBrandColor, setLogoUrl]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await brandingService.update({ brandColor: color, logoUrl: logo || undefined });
      setBrandColor(color);
      setLogoUrl(logo);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert(e.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setColor(DEFAULT_BRAND_COLOR);
    setLogo(null);
    resetBranding();
    try {
      await brandingService.update({ brandColor: DEFAULT_BRAND_COLOR, logoUrl: '' });
    } catch {}
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setLogo(base64);
    };
    reader.readAsDataURL(file);
  };

  // Live preview: apply color change in real-time
  useEffect(() => {
    document.documentElement.style.setProperty('--color-brand', color);
  }, [color]);

  if (loading) return <div className="flex justify-center items-center h-64"><p className="text-gray-500">กำลังโหลด...</p></div>;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Palette className="h-7 w-7" style={{ color }} /> ตั้งค่าแบรนด์คลินิก
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          ปรับแต่งสีหลักและโลโก้ของคลินิก เปลี่ยนแปลงจะมีผลทันทีทั้งระบบ
        </p>
      </div>

      {/* Color Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎨 สีหลัก (Brand Color)</h2>
        
        {/* Color Picker */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              className="w-20 h-20 rounded-2xl cursor-pointer border-4 border-white dark:border-gray-700 shadow-xl transition-transform hover:scale-105"
              style={{ backgroundColor: color, appearance: 'none', padding: 0 }}
            />
            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-lg border border-gray-100 dark:border-gray-600">
              <Palette className="h-4 w-4" style={{ color }} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">สีประจำคลินิก</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-mono font-black tracking-tight" style={{ color }}>
                {color.toUpperCase()}
              </span>
              <div 
                className="w-3 h-3 rounded-full animate-pulse" 
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
        </div>

        {/* Preset Colors */}
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">สีแนะนำ</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-lg transition-all hover:scale-110 flex items-center justify-center ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800' : ''}`}
                style={{ backgroundColor: c }}
                title={c}
              >
                {color === c && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">ตัวอย่างการแสดงผล</p>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: color }}>
              ปุ่มหลัก
            </button>
            <button className="px-4 py-2 text-sm font-semibold rounded-lg border-2" style={{ borderColor: color, color }}>
              ปุ่มรอง
            </button>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: color }}>
              Badge
            </span>
            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: color + '20', color }}>
              <span className="text-sm font-bold">A</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🖼️ โลโก้คลินิก</h2>
        
        <div className="flex items-start gap-6">
          {/* Logo Preview */}
          <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 overflow-hidden flex-shrink-0">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center">
                <img src="/next.svg" alt="placeholder" className="h-8 w-8 mx-auto mb-1 opacity-30 dark:invert" />
                <p className="text-[10px] text-gray-400">ยังไม่มีโลโก้</p>
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              อัปโหลดโลโก้คลินิก (PNG, JPG, SVG) ขนาดไม่เกิน 2MB
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: color }}
              >
                <Upload className="h-4 w-4" />
                เลือกไฟล์
              </button>
              {logo && (
                <button
                  onClick={() => setLogo(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  ลบโลโก้
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          รีเซ็ตค่าเริ่มต้น
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50"
          style={{ backgroundColor: color }}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              บันทึกแล้ว!
            </>
          ) : saving ? (
            'กำลังบันทึก...'
          ) : (
            'บันทึกการเปลี่ยนแปลง'
          )}
        </button>
      </div>
    </div>
  );
}
