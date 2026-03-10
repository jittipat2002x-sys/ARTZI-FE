'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  X,
  Layout,
  Box,
  Monitor
} from 'lucide-react';
import { ipdService, Ward, Cage } from '@/services/ipd.service';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandInput } from '@/components/ui/brand-input';
import { AlertModal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { useBranding } from '@/contexts/branding-context';

interface WardManagerProps {
  branchId: string;
  onUpdate: () => void;
}

export function WardManager({ branchId, onUpdate }: WardManagerProps) {
  const { brandColor } = useBranding();
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingWard, setIsAddingWard] = useState(false);
  const [newWardName, setNewWardName] = useState('');
  
  const [editingWardId, setEditingWardId] = useState<string | null>(null);
  const [editingWardName, setEditingWardName] = useState('');

  const [addingCageToWardId, setAddingCageToWardId] = useState<string | null>(null);
  const [newCage, setNewCage] = useState({
    name: '',
    type: 'STANDARD',
    size: 'M',
    defaultPrice: 0,
    isActive: true
  });

  const [editingCageId, setEditingCageId] = useState<string | null>(null);
  const [editingCageData, setEditingCageData] = useState({
    name: '',
    type: 'STANDARD',
    size: 'M',
    defaultPrice: 0,
    isActive: true
  });
  
  const [hoveringAddCageId, setHoveringAddCageId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    type: 'danger'
  });

  const loadData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const data = await ipdService.getWards(branchId);
      setWards(data);
    } catch (error) {
      console.error('Failed to load wards', error);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateWard = async () => {
    if (!newWardName.trim()) return;
    try {
      await ipdService.createWard({ name: newWardName, branchId });
      setNewWardName('');
      setIsAddingWard(false);
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Create ward failed', error);
    }
  };

  const handleUpdateWard = async (id: string) => {
    if (!editingWardName.trim()) return;
    try {
      await ipdService.updateWard(id, { name: editingWardName });
      setEditingWardId(null);
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Update ward failed', error);
    }
  };

  const handleDeleteWard = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันการลบหออภิบาล',
      description: 'ยืนยันคุณต้องการลบหออภิบาลนี้? กรงทั้งหมดภายใต้หอนี้จะถูกลบไปด้วย และไม่สามารถกู้คืนได้',
      onConfirm: async () => {
        try {
          await ipdService.deleteWard(id);
          loadData();
          onUpdate();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
          console.error('Delete ward failed', error);
          setConfirmConfig(prev => ({ 
            ...prev, 
            isOpen: true,
            title: 'ไม่สามารถลบหออภิบาลได้',
            description: error.message || 'เกิดข้อผิดพลาดในการลบหออภิบาล',
            type: 'warning',
            onConfirm: () => setConfirmConfig(p => ({ ...p, isOpen: false }))
          }));
        }
      },
      type: 'danger'
    });
  };

  const handleAddCage = async (wardId: string) => {
    if (!newCage.name.trim()) return;
    try {
      await ipdService.createCage({
        ...newCage,
        wardId
      });
      setNewCage({ name: '', type: 'STANDARD', size: 'M', defaultPrice: 0, isActive: true });
      setAddingCageToWardId(null);
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Create cage failed', error);
    }
  };

  const handleUpdateCage = async (id: string) => {
    if (!editingCageData.name.trim()) return;
    try {
      await ipdService.updateCage(id, editingCageData);
      setEditingCageId(null);
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Update cage failed', error);
    }
  };

  const handleDeleteCage = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันการลบกรง',
      description: 'ยืนยันคุณต้องการลบกรงนี้หรือไม่? ข้อมูลประวัติการใช้งานบางส่วนอาจได้รับผลกระทบ',
      onConfirm: async () => {
        try {
          await ipdService.deleteCage(id);
          loadData();
          onUpdate();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
          console.error('Delete cage failed', error);
          setConfirmConfig(prev => ({ 
            ...prev, 
            isOpen: true,
            title: 'ไม่สามารถลบกรงได้',
            description: error.message || 'เกิดข้อผิดพลาดในการลบกรง',
            type: 'warning',
            onConfirm: () => setConfirmConfig(p => ({ ...p, isOpen: false }))
          }));
        }
      },
      type: 'danger'
    });
  };

  if (loading && wards.length === 0) return <div className="text-center py-10">กำลังโหลด...</div>;

  return (
    <div className="flex flex-col h-[75vh] bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl overflow-hidden">
      {/* Header & Add Ward - Sticky */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-6 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-brand/10 text-brand rounded-2xl" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
                <Layout size={28} />
            </div>
            <div>
                <h3 className="text-xl font-black">จัดการหออภิบาล</h3>
                <p className="text-sm text-gray-500">แบ่งโซนพื้นที่การดูแลสัตว์เลี้ยงภายในคลินิก</p>
            </div>
        </div>
        
        {!isAddingWard ? (
          <BrandButton 
            onClick={() => setIsAddingWard(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold active:scale-95 transition-all text-white"
          >
            <Plus size={20} />
            เพิ่มหออภิบาลใหม่
          </BrandButton>
        ) : (
          <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
            <BrandInput 
              autoFocus
              className="w-64"
              placeholder="ระบุชื่อหออภิบาล (เช่น หมาป่วย, แมวป่วย)..."
              value={newWardName}
              onChange={e => setNewWardName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateWard()}
            />
            <BrandButton onClick={handleCreateWard} className="p-3 rounded-xl"><Plus size={20} /></BrandButton>
            <BrandButton variant="ghost" onClick={() => setIsAddingWard(false)} className="p-3 rounded-xl"><X size={20} /></BrandButton>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {/* Wards List */}
        <div className="grid grid-cols-1 gap-6">
        {wards.map(ward => (
          <div key={ward.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-300 dark:border-gray-600 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between bg-gray-50/30 dark:bg-gray-900/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-500">
                    <Monitor size={20} />
                </div>
                {editingWardId === ward.id ? (
                  <div className="flex items-center gap-2">
                    <BrandInput 
                      autoFocus
                      className="w-48"
                      value={editingWardName}
                      onChange={e => setEditingWardName(e.target.value)}
                    />
                    <BrandButton variant="ghost" size="sm" onClick={() => handleUpdateWard(ward.id)} className="font-bold">บันทึก</BrandButton>
                    <BrandButton variant="ghost" size="sm" onClick={() => setEditingWardId(null)} className="text-gray-400 font-bold">ยกเลิก</BrandButton>
                  </div>
                ) : (
                  <h4 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-3">
                    {ward.name}
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full font-bold text-gray-400 uppercase tracking-widest">
                        {ward.cages.length} Cages
                    </span>
                  </h4>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                    onClick={() => { setEditingWardId(ward.id); setEditingWardName(ward.name); }}
                    className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                >
                    <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteWard(ward.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 items-stretch">
                {ward.cages.map(cage => (
                  <div key={cage.id} className={cn(
                    "group relative flex flex-col p-5 bg-white dark:bg-gray-800/50 border rounded-3xl transition-all duration-300 h-full",
                    cage.isActive === false 
                      ? "border-gray-200 dark:border-gray-700 opacity-60 grayscale-[0.5]" 
                      : "border-gray-200 dark:border-gray-600 hover:border-brand"
                  )}>
                    {editingCageId === cage.id ? (
                      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <BrandInput 
                          label="ชื่อกรง"
                          autoFocus
                          value={editingCageData.name}
                          onChange={e => setEditingCageData({...editingCageData, name: e.target.value})}
                        />
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">ประเภทกรง</label>
                          <div className="flex flex-wrap gap-1">
                            {['STANDARD', 'OXYGEN', 'ISOLATION'].map(type => (
                              <button
                                key={type}
                                onClick={() => setEditingCageData({...editingCageData, type: type as any})}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all",
                                  editingCageData.type === type 
                                    ? "bg-brand/10 border-brand text-brand" 
                                    : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400"
                                )}
                                style={editingCageData.type === type ? { borderColor: brandColor, color: brandColor, backgroundColor: brandColor + '15' } : {}}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">ขนาด</label>
                          <div className="flex gap-1">
                            {['S', 'M', 'L', 'XL'].map(size => (
                              <button
                                key={size}
                                onClick={() => setEditingCageData({...editingCageData, size})}
                                className={cn(
                                  "flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all",
                                  editingCageData.size === size 
                                    ? "bg-brand/10 border-brand text-brand" 
                                    : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400"
                                )}
                                style={editingCageData.size === size ? { borderColor: brandColor, color: brandColor, backgroundColor: brandColor + '15' } : {}}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>

                        <BrandInput 
                          label="ราคา/วัน"
                          type="number"
                          value={editingCageData.defaultPrice.toString()}
                          onChange={e => setEditingCageData({...editingCageData, defaultPrice: Number(e.target.value)})}
                        />

                        <div className="flex items-center gap-2 pt-1">
                          <input 
                            type="checkbox" 
                            id={`edit-cage-active-${cage.id}`}
                            checked={editingCageData.isActive}
                            onChange={e => setEditingCageData({...editingCageData, isActive: e.target.checked})}
                            className="rounded border-gray-300 text-brand focus:ring-brand"
                            style={{ accentColor: brandColor }}
                          />
                          <label htmlFor={`edit-cage-active-${cage.id}`} className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">เปิดใช้งานกรงนี้</label>
                        </div>

                        <div className="flex gap-2 pt-2">
                             <BrandButton onClick={() => handleUpdateCage(cage.id)} className="flex-1 py-2 text-xs font-bold rounded-xl">บันทึก</BrandButton>
                             <BrandButton variant="ghost" onClick={() => setEditingCageId(null)} className="flex-1 py-2 text-gray-500 text-xs font-bold rounded-xl">ยกเลิก</BrandButton>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 bg-brand/5 text-brand rounded-2xl" style={{ backgroundColor: brandColor + '08', color: brandColor }}>
                                <Box size={22} />
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <button 
                                    onClick={() => {
                                        setEditingCageId(cage.id);
                                        setEditingCageData({
                                            name: cage.name,
                                            type: cage.type || 'STANDARD',
                                            size: cage.size || 'M',
                                            defaultPrice: cage.defaultPrice || 0,
                                            isActive: cage.isActive !== false
                                        });
                                    }}
                                    className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-all"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteCage(cage.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h5 className="font-black text-lg text-gray-900 dark:text-white truncate mb-1">{cage.name}</h5>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">{cage.size}</span>
                            <div className="h-1 w-1 rounded-full bg-gray-300" />
                            <span className="text-[10px] font-black text-brand uppercase tracking-widest" style={{ color: brandColor }}>{cage.type}</span>
                            {cage.isActive === false && (
                              <span className="text-[9px] font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded uppercase tracking-tighter ml-auto">Disabled</span>
                            )}
                        </div>
                        
                        <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700/50 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ราคาต่อวัน</span>
                            <span className="text-sm font-black text-gray-900 dark:text-white">
                                {cage.defaultPrice && cage.defaultPrice > 0 ? (
                                    <>฿{cage.defaultPrice.toLocaleString()}</>
                                ) : (
                                    <span className="text-gray-300">ไม่ระบุ</span>
                                )}
                            </span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                {addingCageToWardId === ward.id ? (
                  <div className="flex flex-col p-6 bg-brand/[0.02] border-2 border-dashed border-brand/20 rounded-3xl animate-in fade-in zoom-in-95 duration-300 h-full" style={{ borderColor: brandColor + '30' }}>
                    <h5 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: brandColor }}>
                        <Plus size={16} /> เพิ่มกรงใหม่
                    </h5>
                    
                    <div className="space-y-4">
                        <BrandInput 
                          placeholder="ชื่อกรง (เช่น กรง A01)..."
                          label="ชื่อกรง"
                          autoFocus
                          value={newCage.name}
                          onChange={e => setNewCage({...newCage, name: e.target.value})}
                        />

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">ขนาด</label>
                          <div className="flex gap-1">
                            {['S', 'M', 'L', 'XL'].map(size => (
                              <button
                                key={size}
                                onClick={() => setNewCage({...newCage, size})}
                                className={cn(
                                  "flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-all",
                                  newCage.size === size 
                                    ? "bg-brand/10 border-brand text-brand" 
                                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400"
                                )}
                                style={newCage.size === size ? { borderColor: brandColor, color: brandColor, backgroundColor: brandColor + '15' } : {}}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">ประเภท</label>
                          <div className="flex flex-wrap gap-1">
                            {['STANDARD', 'OXYGEN', 'ISOLATION'].map(type => (
                              <button
                                key={type}
                                onClick={() => setNewCage({...newCage, type: type as any})}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all",
                                  newCage.type === type 
                                    ? "bg-brand/10 border-brand text-brand" 
                                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400"
                                )}
                                style={newCage.type === type ? { borderColor: brandColor, color: brandColor, backgroundColor: brandColor + '15' } : {}}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        <BrandInput 
                          label="ราคาพื้นฐาน/วัน"
                          type="number"
                          placeholder="0"
                          value={newCage.defaultPrice.toString()}
                          onChange={e => setNewCage({...newCage, defaultPrice: Number(e.target.value)})}
                        />

                        <div className="flex items-center gap-2 pt-1">
                          <input 
                            type="checkbox" 
                            id="new-cage-active"
                            checked={newCage.isActive}
                            onChange={e => setNewCage({...newCage, isActive: e.target.checked})}
                            className="rounded border-gray-300 text-brand focus:ring-brand"
                            style={{ accentColor: brandColor }}
                          />
                          <label htmlFor="new-cage-active" className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">เปิดใช้งานกรงนี้</label>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                            <BrandButton onClick={() => handleAddCage(ward.id)} className="flex-1 py-2.5 text-xs font-bold rounded-xl">เพิ่มกรง</BrandButton>
                            <BrandButton variant="ghost" onClick={() => setAddingCageToWardId(null)} className="flex-1 py-2.5 text-gray-500 text-xs font-bold rounded-xl">ยกเลิก</BrandButton>
                        </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setAddingCageToWardId(ward.id)}
                    onMouseEnter={() => setHoveringAddCageId(ward.id)}
                    onMouseLeave={() => setHoveringAddCageId(null)}
                    className="flex flex-col items-center justify-center p-5 bg-gray-50/50 dark:bg-gray-900/20 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl hover:bg-brand/[0.02] group transition-all duration-300 h-full"
                    style={hoveringAddCageId === ward.id ? { borderColor: brandColor + '40', backgroundColor: brandColor + '05' } : {}}
                  >
                    <div 
                        className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-50 dark:border-gray-700 group-hover:scale-110 transition-transform mb-3"
                        style={hoveringAddCageId === ward.id ? { borderColor: brandColor + '20' } : {}}
                    >
                        <Plus size={24} style={{ color: brandColor }} />
                    </div>
                    <span 
                        className="text-xs font-black text-gray-400 transition-colors uppercase tracking-widest"
                        style={hoveringAddCageId === ward.id ? { color: brandColor } : {}}
                    >
                        เพิ่มกรงเพิ่ม
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {wards.length === 0 && !loading && (
            <div className="py-20 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <Layout size={48} className="text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold">ยังไม่มีข้อมูลหออภิบาล</p>
                <p className="text-xs text-gray-400 mt-1">คลิกปุ่ม &quot;เพิ่มหออภิบาลใหม่&quot; เพื่อเริ่มต้น</p>
            </div>
        )}
        </div>
      </div>

      <AlertModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        type={confirmConfig.type}
      />
    </div>
  );
}
