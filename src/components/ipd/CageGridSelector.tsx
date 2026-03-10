'use client';

import React, { useState } from 'react';
import { Box, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { Ward, Cage } from '@/services/ipd.service';
import { cn } from '@/lib/utils';
import { useBranding } from '@/contexts/branding-context';
import { BrandInput } from '@/components/ui/brand-input';

interface CageGridSelectorProps {
  wards: Ward[];
  onSelectCage: (cage: Cage) => void;
  selectedCageId?: string;
  className?: string;
  showSearch?: boolean;
}

export function CageGridSelector({ 
  wards, 
  onSelectCage, 
  selectedCageId,
  className,
  showSearch = true
}: CageGridSelectorProps) {
  const { brandColor } = useBranding();
  const [activeWardId, setActiveWardId] = useState<string | null>(wards.length > 0 ? wards[0].id : null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeWard = wards.find(w => w.id === activeWardId) || wards[0];

  const filteredCages = activeWard?.cages.filter(cage => 
    (cage.isActive !== false) && (
      cage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cage.type && cage.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cage.size && cage.size.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  ) || [];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Ward Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
        {wards.map(ward => (
          <button
            key={ward.id}
            onClick={() => setActiveWardId(ward.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2",
              activeWardId === ward.id
                ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600"
                : "text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50"
            )}
            style={activeWardId === ward.id ? { color: brandColor } : {}}
          >
            <div className={cn(
              "h-1.5 w-1.5 rounded-full",
              activeWardId === ward.id ? "bg-brand" : "bg-gray-300 dark:bg-gray-600"
            )} style={activeWardId === ward.id ? { backgroundColor: brandColor } : {}} />
            {ward.name}
            <span className="opacity-40 text-[10px]">({ward.cages.length})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="ค้นหากรง, ประเภท, ขนาด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-brand/20 outline-none transition-all dark:text-gray-200"
          />
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredCages.map(cage => {
          const activeAdmissions = cage.admissions?.filter(a => a.status === 'ADMITTED') || [];
          const isOccupied = activeAdmissions.length > 0;
          const isSelected = selectedCageId === cage.id;

          return (
            <button
              key={cage.id}
              onClick={() => onSelectCage(cage)}
              className={cn(
                "group flex flex-col p-3 rounded-2xl border text-left transition-all relative overflow-hidden h-full",
                isSelected
                  ? "bg-brand/5 border-brand ring-2 ring-brand/20"
                  : isOccupied
                    ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand"
                    : "bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 border-dashed hover:border-brand hover:bg-white dark:hover:bg-gray-800"
              )}
              style={isSelected ? { borderColor: brandColor, backgroundColor: brandColor + '08' } : {}}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={cn(
                  "p-1.5 rounded-lg",
                  isOccupied ? "bg-brand/10 text-brand" : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                )} style={isOccupied ? { color: brandColor, backgroundColor: brandColor + '15' } : {}}>
                  {cage.type === 'OXYGEN' ? <AlertCircle size={14} className="text-red-500" /> : <Box size={14} />}
                </div>
                {isSelected && (
                  <CheckCircle2 size={16} className="text-brand" style={{ color: brandColor }} />
                )}
              </div>

              <div className="min-w-0">
                <h4 className="font-black text-sm text-gray-900 dark:text-white truncate leading-tight">{cage.name}</h4>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">{cage.size || 'M'}</span>
                  <div className="h-0.5 w-0.5 rounded-full bg-gray-300" />
                  <span className="text-[9px] font-bold text-gray-400 uppercase truncate">{cage.type || 'STND'}</span>
                </div>
              </div>

              {isOccupied && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 space-y-1">
                  {activeAdmissions.map(adm => (
                    <div key={adm.id} className="text-[9px] font-black text-brand truncate flex items-center gap-1" style={{ color: brandColor }}>
                      <div className="h-1 w-1 rounded-full bg-brand" style={{ backgroundColor: brandColor }} />
                      {adm.pet?.name}
                    </div>
                  ))}
                  <div className="text-[8px] font-bold text-gray-400 mt-1">
                    {activeAdmissions.length} Pets Occupied
                  </div>
                </div>
              )}

              {!isOccupied && (
                <div className="mt-2 text-[9px] font-bold text-gray-300 italic">
                  ว่าง (Available)
                </div>
              )}
              
              {/* Background Decoration */}
              <div className="absolute -right-2 -bottom-2 text-gray-100 dark:text-gray-800/10 rotate-12 pointer-events-none">
                <Box size={40} />
              </div>
            </button>
          );
        })}

        {filteredCages.length === 0 && (
          <div className="col-span-full py-10 text-center">
            <p className="text-xs font-bold text-gray-400 italic">ไม่พบข้อมูลกรงที่ค้นหา...</p>
          </div>
        )}
      </div>
    </div>
  );
}
