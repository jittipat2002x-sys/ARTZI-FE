'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Home, 
  Plus, 
  Settings, 
  Dog, 
  Cat, 
  AlertCircle,
  LogOut,
  History,
  Info,
  Box,
  X
} from 'lucide-react';
import { ipdService, Ward, Cage, Admission } from '@/services/ipd.service';
import { petService } from '@/services/pet.service';
import { customerService, Customer } from '@/services/customer.service';
import { authService } from '@/services/auth.service';
import { useBranding } from '@/contexts/branding-context';
import { cn } from '@/lib/utils';
import { WardManager } from './components/WardManager';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Modal, AlertModal } from '@/components/ui/modal';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandInput } from '@/components/ui/brand-input';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { PrintInvoiceModal } from '../customers/components/PrintInvoiceModal';

export default function IpdPage() {
  const [user, setUser] = useState<any>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWardId, setActiveWardId] = useState<string | null>(null);
  const { brandColor } = useBranding();
  
  // Modals / Selection states
  const [isWardSettingsOpen, setIsWardSettingsOpen] = useState(false);
  const [selectedCage, setSelectedCage] = useState<Cage | null>(null);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferTargetWardId, setTransferTargetWardId] = useState<string | null>(null);
  
  // Admission Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [ownerPets, setOwnerPets] = useState<any[]>([]);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [admissionForm, setAdmissionForm] = useState({
    notes: '',
    isBoarding: true,
    dailyPrice: 0,
    estimatedDays: 1
  });
  const [isEditingAdmission, setIsEditingAdmission] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
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

  const loadWards = useCallback(async (branchId: string) => {
    setLoading(true);
    try {
      const res = await ipdService.getWards(branchId);
      const data = Array.isArray(res) ? res : (res && Array.isArray((res as any).data) ? (res as any).data : []);
      setWards(data);
      // Auto-set the first ward if none is selected
      setActiveWardId(prev => (prev ? prev : (data.length > 0 ? data[0].id : null)));
    } catch (error) {
      console.error('Failed to load wards', error);
      setWards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
        let currentUser = authService.getUser();
        if (!currentUser?.branchId) {
            currentUser = await authService.me();
        }
        setUser(currentUser);
        if (currentUser?.branchId) {
          loadWards(currentUser.branchId);
        }
    };
    loadInitialData();
  }, [loadWards]);

  useEffect(() => {
    if (selectedCage) {
      searchCustomers('');
      setAdmissionForm({
        notes: '',
        isBoarding: true,
        dailyPrice: selectedCage.defaultPrice || 0,
        estimatedDays: 1
      });
    }
  }, [selectedCage]);

  useEffect(() => {
    if (selectedAdmission && isEditingAdmission) {
      setAdmissionForm({
        notes: selectedAdmission.notes || '',
        isBoarding: selectedAdmission.isBoarding || false,
        dailyPrice: selectedAdmission.dailyPrice || 0,
        estimatedDays: selectedAdmission.estimatedDays || 1
      });
    }
  }, [selectedAdmission, isEditingAdmission]);

  const handleAdmit = async () => {
    if (!selectedCage || selectedPetIds.length === 0 || !user?.branchId) return;
    setIsAdmitting(true);
    try {
      // Loop to admit each selected pet
      for (const petId of selectedPetIds) {
        await ipdService.admit({
          petId,
          cageId: selectedCage.id,
          branchId: user.branchId,
          notes: admissionForm.notes,
          isBoarding: admissionForm.isBoarding,
          dailyPrice: Number(admissionForm.dailyPrice),
          estimatedDays: Number(admissionForm.estimatedDays)
        } as any);
      }
      setSelectedCage(null);
      setSelectedCustomerId('');
      setOwnerPets([]);
      setSelectedPetIds([]);
      setAdmissionForm({ notes: '', isBoarding: true, dailyPrice: 0, estimatedDays: 1 });
      loadWards(user.branchId);
    } catch (error: any) {
      alert(error.message || 'การแอดมิทล้มเหลว');
    } finally {
      setIsAdmitting(false);
    }
  };

  const handleUpdateAdmission = async () => {
    if (!selectedAdmission || !user?.branchId) return;
    setIsAdmitting(true);
    try {
      await ipdService.updateAdmission(selectedAdmission.id, {
        notes: admissionForm.notes,
        isBoarding: admissionForm.isBoarding,
        dailyPrice: Number(admissionForm.dailyPrice),
        estimatedDays: Number(admissionForm.estimatedDays)
      } as any);
      setIsEditingAdmission(false);
      setSelectedAdmission(null);
      loadWards(user.branchId);
    } catch (error: any) {
      alert(error.message || 'การแก้ไขล้มเหลว');
    } finally {
      setIsAdmitting(false);
    }
  };

  const handleDeleteAdmission = async (admissionId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันการลบข้อมูล',
      description: 'ยืนยันลบข้อมูลการแอดมิท? ข้อมูลทั้งหมดจะหายไปและไม่สามารถกู้คืนได้',
      onConfirm: async () => {
        try {
          await ipdService.deleteAdmission(admissionId);
          setSelectedAdmission(null);
          if (user?.branchId) loadWards(user.branchId);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
          alert(error.message || 'ลบข้อมูลล้มเหลว');
        }
      },
      type: 'danger'
    });
  };

  const handleDischarge = async (admissionId: string) => {
    if (!user?.branchId) return;
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันการนำออกจากกรง',
      description: 'ยืนยันความต้องการนำสัตว์เลี้ยงออกจากกรงและที่พัก?',
      onConfirm: async () => {
        try {
          await ipdService.discharge(admissionId);
          setSelectedAdmission(null);
          loadWards(user.branchId);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Discharge failed', error);
        }
      },
      type: 'warning'
    });
  };

  const handleTransfer = async (admissionId: string, newCageId: string) => {
    if (!user?.branchId) return;
    try {
      await ipdService.transfer(admissionId, newCageId);
      setIsTransferring(false);
      setSelectedAdmission(null);
      loadWards(user.branchId);
    } catch (error: any) {
      alert(error.message || 'การย้ายกรงล้มเหลว');
    }
  };

  const searchCustomers = async (query: string) => {
    setIsSearchingCustomers(true);
    try {
        const res = await customerService.getCustomers(1, 20, query, user?.branchId);
        const data = Array.isArray(res) ? res : (res.data || []);
        const formatted = data.map((c: Customer) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}${c.phone ? ` (${c.phone})` : ''}`,
        }));
        setCustomerOptions(formatted);
    } catch (error) {
        console.error('Search customers failed', error);
        setCustomerOptions([]);
    } finally {
        setIsSearchingCustomers(false);
    }
  };

  const handleCustomerSelect = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedPetIds([]);
    if (!customerId) {
        setOwnerPets([]);
        return;
    }
    try {
        const customer = await customerService.getCustomerById(customerId);
        setOwnerPets(customer.pets || []);
        // Auto select if only one pet? Maybe better let user choose.
    } catch (error) {
        console.error('Failed to load customer pets', error);
    }
  };

  const searchPets = async (query: string) => {
    try {
        const res = await (petService as any).getPets(undefined, query);
        const data = Array.isArray(res) ? res : (res.data || []);
        return data.map((p: any) => ({
          value: p.id,
          label: `${p.name} (${p.customer?.firstName} ${p.customer?.lastName})`,
          subLabel: `${p.species} | ${p.breed || 'ไม่ระบุสายพันธุ์'}`,
        }));
    } catch (error) {
        console.error('Search pets failed', error);
        return [];
    }
  };

  const activeWard = Array.isArray(wards) ? wards.find(w => w.id === activeWardId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
             <div className="p-2 bg-brand/10 rounded-xl" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
                <Box size={24} />
             </div>
             จัดการกรงและที่พัก (Boarding)
          </h1>
          <p className="text-gray-500 dark:text-gray-400">จัดการข้อมูลกรงพักและสถานะการรักษาตัวของสัตว์เลี้ยง</p>
        </div>
        
        <div className="flex items-center gap-2">
           <BrandButton 
            variant="outline"
            onClick={() => setIsWardSettingsOpen(true)}
            className="flex items-center gap-2 rounded-xl"
          >
            <Settings size={18} />
            <span>ตั้งค่ากรงและห้อง</span>
          </BrandButton>
        </div>
      </div>

      {/* Ward Selector (Rooms) */}
      <div className="bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-2xl inline-flex flex-wrap items-center gap-1.5 border border-gray-200 dark:border-gray-700">
        {wards.map(ward => (
          <button
            key={ward.id}
            onClick={() => setActiveWardId(ward.id)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-black whitespace-nowrap transition-all flex items-center gap-3",
              activeWardId === ward.id
                ? "bg-white dark:bg-gray-700 text-brand"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50"
            )}
            style={activeWardId === ward.id ? { color: brandColor } : {}}
          >
            <div className={cn(
                "h-2 w-2 rounded-full",
                activeWardId === ward.id ? "bg-brand animate-pulse" : "bg-gray-300 dark:bg-gray-600"
            )} style={activeWardId === ward.id ? { backgroundColor: brandColor } : {}} />
            {ward.name}
            <span className={cn(
                "px-2 py-0.5 rounded-lg text-[10px] font-black",
                activeWardId === ward.id ? "bg-brand/10 text-brand" : "bg-gray-200 dark:bg-gray-600 text-gray-400"
            )} style={activeWardId === ward.id ? { color: brandColor, backgroundColor: brandColor + '15' } : {}}>
                {ward.cages.length}
            </span>
          </button>
        ))}
        
        {wards.length === 0 && !loading && (
          <div className="text-xs text-gray-400 px-4 py-2 italic font-medium">ยังไม่มีหออภิบาล...</div>
        )}
      </div>

      {/* Cages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {activeWard?.cages.map(cage => {
          const admission = cage.admissions?.find(a => a.status === 'ADMITTED');
          const isOccupied = !!admission;

          return (
            <div 
              key={cage.id}
              className={cn(
                "group flex flex-col p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                isOccupied 
                  ? "bg-white dark:bg-gray-800 border-brand" 
                  : "bg-gray-50/50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 border-dashed hover:border-brand hover:bg-white dark:hover:bg-gray-800"
              )}
              style={isOccupied ? { borderColor: brandColor } : {}}
              onClick={() => {
                setSelectedCage(cage);
              }}
              onMouseEnter={(e) => {
                if (!isOccupied) {
                  e.currentTarget.style.borderColor = brandColor;
                  // Keep background subtle
                  e.currentTarget.style.backgroundColor = brandColor + '05'; 
                  // Find the plus icon and text to change their color
                  const icon = e.currentTarget.querySelector('.plus-icon') as HTMLElement;
                  const label = e.currentTarget.querySelector('.admit-label') as HTMLElement;
                  if (icon) icon.style.color = brandColor;
                  if (label) label.style.color = brandColor;
                }
              }}
              onMouseLeave={(e) => {
                if (!isOccupied) {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.backgroundColor = '';
                  const icon = e.currentTarget.querySelector('.plus-icon') as HTMLElement;
                  const label = e.currentTarget.querySelector('.admit-label') as HTMLElement;
                  if (icon) icon.style.color = '';
                  if (label) label.style.color = '';
                }
              }}
            >
              {/* Cage Status Badge */}
              <div className="flex items-start justify-between mb-4 z-10">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl transition-colors",
                    isOccupied ? "bg-brand/10 text-brand" : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                  )} style={isOccupied ? { color: brandColor, backgroundColor: brandColor + '15' } : {}}>
                    {cage.type === 'OXYGEN' ? <AlertCircle size={22} className="text-red-500" /> : <Box size={22} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white leading-none text-lg">{cage.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cage.size || 'M'}</span>
                        <div className="h-1 w-1 rounded-full bg-gray-300" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cage.type || 'Standard'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {isOccupied ? (
                <div className="space-y-4 z-10">
                  <div className="space-y-2">
                    {cage.admissions?.filter(a => a.status === 'ADMITTED').map(adm => (
                      <div key={adm.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:border-brand transition-colors"
                           onClick={(e) => {
                             e.stopPropagation();
                             setSelectedAdmission(adm);
                           }}>
                        <div className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-600 text-gray-500 shrink-0">
                          {adm.pet?.species === 'แมว' ? <Cat size={18} className="text-orange-400" /> : <Dog size={18} className="text-blue-400"/>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 dark:text-white truncate text-sm">{adm.pet?.name}</p>
                          <p className="text-[10px] font-medium text-gray-500 truncate">{adm.pet?.customer?.firstName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-[11px] font-medium px-1">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <History size={14} />
                      <span>{cage.admissions?.[0] ? format(new Date(cage.admissions[0].admittedAt), 'd MMM HH:mm', { locale: th }) : ''}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-500">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span>{cage.admissions?.filter(a => a.status === 'ADMITTED').length} Pets</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center z-10 transition-colors">
                   <div className="plus-icon h-12 w-12 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center mb-2 transition-colors">
                      <Plus size={28} className="text-gray-300" />
                   </div>
                   <span className="admit-label text-xs font-bold text-gray-400 transition-colors">คลิกเพื่อฝากเลี้ยง</span>
                </div>
              )}
              
              {/* Decoration Background Icon */}
               <div className="absolute -right-4 -bottom-4 text-gray-100 dark:text-gray-800/10 rotate-12 pointer-events-none">
                  <Box size={100} />
               </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand" style={{ borderColor: brandColor }}></div>
          <p className="mt-4 font-bold text-gray-500">กำลังเตรียมข้อมูลหออภิบาล...</p>
        </div>
      )}

      {/* Ward Settings Modal */}
      <Modal 
        isOpen={isWardSettingsOpen} 
        onClose={() => setIsWardSettingsOpen(false)}
        showCloseButton={false}
        className="sm:max-w-5xl h-fit max-h-[90vh]"
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 z-10">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl">
                    <Settings size={22} className="text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">จัดการหออภิบาลและกรง</h2>
                    <p className="text-xs text-gray-500">ตั้งค่าพื้นที่ ห้องพัก และกรงสำหรับสัตว์ป่วย</p>
                </div>
            </div>
            <button 
              onClick={() => setIsWardSettingsOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 dark:bg-gray-900/20">
             <WardManager 
                branchId={user?.branchId} 
                onUpdate={() => user?.branchId && loadWards(user.branchId)} 
             />
          </div>
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 text-center">
             <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">PetHeart IPD Management System</p>
          </div>
        </div>
      </Modal>

      {/* Admission Modal (Admitting a pet) */}
      <Modal
        isOpen={!!selectedCage}
        onClose={() => setSelectedCage(null)}
        className="sm:max-w-md rounded-3xl max-h-[90vh] flex flex-col"
        showCloseButton={false}
      >
        <div className="overflow-y-auto flex-1">
        <div className="p-8 pb-4">
           <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-brand/10 rounded-2xl" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
                <Plus size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">เช็คอินสู่กรง {selectedCage?.name}</h3>
                <p className="text-sm text-gray-500 leading-tight">กรุณาเลือกสัตว์เลี้ยงที่ต้องการฝากเลี้ยง</p>
              </div>
           </div>

           <div className="space-y-5">
              {/* Show current occupants if any */}
              {selectedCage?.admissions?.filter(a => a.status === 'ADMITTED').length! > 0 && (
                <div className="bg-brand/5 border border-brand/10 p-4 rounded-2xl space-y-2" style={{ backgroundColor: brandColor + '05', borderColor: brandColor + '20' }}>
                  <label className="text-[10px] font-black text-brand uppercase tracking-widest block" style={{ color: brandColor }}>สัตว์เลี้ยงที่อยู่ในกรงขณะนี้</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCage?.admissions?.filter(a => a.status === 'ADMITTED').map(adm => (
                      <div key={adm.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        {adm.pet?.species === 'แมว' ? <Cat size={14} className="text-orange-400" /> : <Dog size={14} className="text-blue-400" />}
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{adm.pet?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">เลือกเจ้าของสัตว์เลี้ยง</label>
                <SearchableSelect 
                  placeholder="พิมพ์ชื่อเจ้าของ หรือเบอร์โทร..."
                  onSearch={searchCustomers}
                  onChange={handleCustomerSelect}
                  value={selectedCustomerId}
                  options={customerOptions}
                  loading={isSearchingCustomers}
                />
              </div>

              {ownerPets.length > 0 && (
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">เลือกสัตว์เลี้ยงที่จะฝากเลี้ยง</label>
                  <div className="flex flex-wrap gap-2">
                    {ownerPets.map(pet => (
                      <button
                        key={pet.id}
                        type="button"
                        onClick={() => {
                          setSelectedPetIds(prev => 
                            prev.includes(pet.id) 
                              ? prev.filter(id => id !== pet.id)
                              : [...prev, pet.id]
                          );
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2",
                          selectedPetIds.includes(pet.id)
                            ? "bg-brand/10 border-brand text-brand"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500"
                        )}
                        style={selectedPetIds.includes(pet.id) ? { borderColor: brandColor, color: brandColor, backgroundColor: brandColor + '15' } : {}}
                      >
                        {pet.species === 'แมว' ? <Cat size={14} /> : <Dog size={14} />}
                        {pet.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}


              <BrandInput
                label="หมายเหตุเพิ่มเติม"
                placeholder="คำสั่งพิเศษ หรือสิ่งที่ต้องระวัง..."
                multiline
                rows={3}
                value={admissionForm.notes}
                onChange={(e) => setAdmissionForm({...admissionForm, notes: (e.target as HTMLTextAreaElement).value})}
              />

              <div className="bg-brand/5 p-4 rounded-2xl border border-brand/10 space-y-4" style={{ backgroundColor: brandColor + '08', borderColor: brandColor + '20' }}>
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-brand/10 rounded-lg" style={{ color: brandColor, backgroundColor: brandColor + '15' }}>
                            <Box size={16} />
                        </div>
                        <span className="text-sm font-bold">บริการฝากเลี้ยง (Boarding)</span>
                      </div>
                      <div className="text-[10px] font-black text-brand uppercase tracking-widest px-2 py-1 bg-brand/10 rounded-lg" style={{ color: brandColor, backgroundColor: brandColor + '15' }}>
                        Active
                      </div>
                  </div>

                  {admissionForm.isBoarding && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <BrandInput
                        label="ราคากรง/วัน"
                        type="number"
                        value={admissionForm.dailyPrice}
                        onChange={(e) => setAdmissionForm({...admissionForm, dailyPrice: Number(e.target.value)})}
                      />
                      <BrandInput
                        label="จำนวนวัน (วัน)"
                        type="number"
                        value={admissionForm.estimatedDays}
                        onChange={(e) => setAdmissionForm({...admissionForm, estimatedDays: Number(e.target.value)})}
                      />
                      <div className="col-span-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-500">ยอดรวมประมาณการ:</span>
                          <span className="text-lg font-black text-brand" style={{ color: brandColor }}>
                            {(Number(admissionForm.dailyPrice) * Number(admissionForm.estimatedDays)).toLocaleString()} ฿
                          </span>
                      </div>
                    </div>
                  )}
              </div>
           </div>
        </div>

        <div className="p-8 pt-4 flex gap-3">
          <BrandButton
            variant="ghost"
            onClick={() => setSelectedCage(null)} 
            className="flex-1 py-3 text-sm font-bold rounded-2xl"
            disabled={isAdmitting}
          >
            ยกเลิก
          </BrandButton>
           <BrandButton 
            onClick={handleAdmit}
            disabled={selectedPetIds.length === 0 || isAdmitting}
            loading={isAdmitting}
            className="flex-[2] py-3 rounded-2xl text-base font-black"
          >
            บันทึกการเช็คอิน
          </BrandButton>
        </div>
        </div>
      </Modal>

      {/* Admission Details Modal (Discharge view) */}
      <Modal
        isOpen={!!selectedAdmission}
        onClose={() => setSelectedAdmission(null)}
        className="sm:max-w-md rounded-3xl overflow-hidden"
      >
        <div className="relative h-32 bg-brand/10" style={{ backgroundColor: brandColor + '15' }}>
           <div className="absolute -bottom-8 left-8">
              <div className="h-20 w-20 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center border-4 border-white dark:border-gray-800 overflow-hidden">
                {selectedAdmission?.pet?.species === 'แมว' ? <Cat size={40} className="text-orange-400" /> : <Dog size={40} className="text-blue-400"/>}
              </div>
           </div>
        </div>

        <div className="p-8 pt-12">
           <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none">{selectedAdmission?.pet?.name}</h3>
                <p className="text-sm font-bold text-brand mt-1" style={{ color: brandColor }}>
                    {selectedAdmission?.pet?.customer?.firstName} {selectedAdmission?.pet?.customer?.lastName}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
                 Cage {selectedAdmission?.cage?.name}
              </div>
           </div>


              {selectedAdmission?.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Info size={14} className="text-amber-500" />
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">หมายเหตุการดูแล</p>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">{selectedAdmission.notes}</p>
                </div>
              )}

              <div className="flex items-center gap-4 py-2 opacity-60">
                 <div className="flex flex-col items-center flex-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">เข้ารับการรักษาเมื่อ</span>
                    <span className="text-xs font-bold">{selectedAdmission ? format(new Date(selectedAdmission.admittedAt), 'd MMMM yyyy', { locale: th }) : ''}</span>
                    <span className="text-xs text-gray-500">{selectedAdmission ? format(new Date(selectedAdmission.admittedAt), 'HH:mm') : ''} น.</span>
                  </div>
              </div>

              {selectedAdmission?.isBoarding && (
                <div className="bg-brand/5 p-4 rounded-2xl border border-brand/20 flex items-center justify-between" style={{ backgroundColor: brandColor + '08', borderColor: brandColor + '20' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand/10 rounded-xl" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
                            <History size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-brand uppercase tracking-widest" style={{ color: brandColor }}>บริการฝากเลี้ยง</p>
                            <p className="text-sm font-bold">{selectedAdmission.dailyPrice} ฿ / วัน ({selectedAdmission.estimatedDays} วัน)</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ยอดรวม</p>
                        <p className="text-lg font-black text-brand" style={{ color: brandColor }}>
                            {(Number(selectedAdmission.dailyPrice || 0) * Number(selectedAdmission.estimatedDays || 0)).toLocaleString()} ฿
                        </p>
                    </div>
                </div>
              )}
           </div>

         <div className="p-8 pt-4 flex flex-col gap-3">
          <div className="flex gap-3">
            <BrandButton 
                variant="outline"
                onClick={() => setIsEditingAdmission(true)}
                className="flex-1 py-3 border-gray-200 text-gray-600 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
            >
                <Settings size={14} />
                <span>แก้ไขรายละเอียด</span>
            </BrandButton>
            <BrandButton 
                variant="outline"
                onClick={() => setIsInvoiceModalOpen(true)}
                className="flex-1 py-3 border-brand/50 text-brand rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ color: brandColor, borderColor: brandColor + '50' }}
            >
                <div className="p-1 bg-brand/10 rounded-lg" style={{ backgroundColor: brandColor + '15' }}>
                   <Plus size={14} />
                </div>
                <span>ใบแจ้งหนี้/ใบเสร็จ</span>
            </BrandButton>
          </div>

          <div className="flex gap-3">
            <BrandButton
                variant="ghost"
                onClick={() => setSelectedAdmission(null)} 
                className="flex-1 py-3 text-sm font-bold rounded-2xl"
            >
                ปิดหน้าต่าง
            </BrandButton>
            <BrandButton 
                variant="outline"
                onClick={() => {
                   setTransferTargetWardId(selectedAdmission?.cage?.wardId || null);
                   setIsTransferring(true);
                }}
                className="flex-1 py-3 border-brand/50 text-brand rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ color: brandColor, borderColor: brandColor + '50' }}
            >
                <div className="p-1 bg-brand/10 rounded-lg" style={{ backgroundColor: brandColor + '15' }}>
                   <Box size={14} />
                </div>
                <span>ย้ายกรง/เปลี่ยนห้อง</span>
            </BrandButton>
          </div>
          
          <div className="flex gap-3">
            <BrandButton 
                onClick={() => selectedAdmission && handleDischarge(selectedAdmission.id)}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-base font-black flex items-center justify-center gap-2 border-none"
                style={{ backgroundColor: '#EF4444' }} 
            >
                <LogOut size={20} />
                <span>นำออกจากกรง</span>
            </BrandButton>
          </div>
        </div>
      </Modal>

      {/* Edit Admission Modal */}
      <Modal
        isOpen={isEditingAdmission}
        onClose={() => setIsEditingAdmission(false)}
        className="sm:max-w-md rounded-3xl max-h-[90vh] flex flex-col"
        showCloseButton={false}
      >
        <div className="overflow-y-auto flex-1">
        <div className="p-8 pb-4">
           <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-brand/10 rounded-2xl" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
                <Settings size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">แก้ไขข้อมูลการฝากเลี้ยง: {selectedAdmission?.pet?.name}</h3>
                <p className="text-sm text-gray-500 leading-tight">ปรับปรุงข้อมูลการฝากเลี้ยงและค่าบริการ</p>
              </div>
           </div>

           <div className="space-y-5">

              <BrandInput
                label="หมายเหตุเพิ่มเติม"
                multiline
                rows={3}
                value={admissionForm.notes}
                onChange={(e) => setAdmissionForm({...admissionForm, notes: (e.target as HTMLTextAreaElement).value})}
              />

              <div className="bg-brand/5 p-4 rounded-2xl border border-brand/10 space-y-4" style={{ backgroundColor: brandColor + '08', borderColor: brandColor + '20' }}>
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">บริการฝากเลี้ยง (Boarding)</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setAdmissionForm({...admissionForm, isBoarding: !admissionForm.isBoarding})}
                        className={cn(
                          "w-11 h-6 rounded-full transition-colors relative",
                          admissionForm.isBoarding ? "bg-brand" : "bg-gray-200"
                        )}
                        style={admissionForm.isBoarding ? { backgroundColor: brandColor } : {}}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                          admissionForm.isBoarding ? "left-6" : "left-1"
                        )} />
                      </button>
                  </div>

                  {admissionForm.isBoarding && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <BrandInput
                        label="ราคากรง/วัน"
                        type="number"
                        value={admissionForm.dailyPrice}
                        onChange={(e) => setAdmissionForm({...admissionForm, dailyPrice: Number(e.target.value)})}
                      />
                      <BrandInput
                        label="จำนวนวัน (วัน)"
                        type="number"
                        value={admissionForm.estimatedDays}
                        onChange={(e) => setAdmissionForm({...admissionForm, estimatedDays: Number(e.target.value)})}
                      />
                    </div>
                  )}
              </div>
           </div>
        </div>

        <div className="p-8 pt-4 flex gap-3">
          <BrandButton
            variant="ghost"
            onClick={() => setIsEditingAdmission(false)} 
            className="flex-1 py-3 text-sm font-bold rounded-2xl"
          >
            ยกเลิก
          </BrandButton>
           <BrandButton 
            onClick={handleUpdateAdmission}
            loading={isAdmitting}
            className="flex-[2] py-3 rounded-2xl text-base font-black"
          >
            บันทึกการแก้ไข
          </BrandButton>
        </div>
        </div>
      </Modal>

      {/* Invoice Modal Integration */}
      {selectedAdmission && (
          <PrintInvoiceModal 
            isOpen={isInvoiceModalOpen}
            onClose={() => setIsInvoiceModalOpen(false)}
            customerName={`${selectedAdmission.pet?.customer?.firstName || ''} ${selectedAdmission.pet?.customer?.lastName || ''}`}
            petNames={selectedAdmission.pet?.name || ''}
            invoiceDate={format(new Date(), 'dd/MM/yyyy')}
            invoiceNumber={`ADM-${selectedAdmission.id.slice(0, 8).toUpperCase()}`}
            totalAmount={Number(selectedAdmission.dailyPrice || 0) * Number(selectedAdmission.estimatedDays || 0)}
            discount={0}
            netAmount={Number(selectedAdmission.dailyPrice || 0) * Number(selectedAdmission.estimatedDays || 0)}
            paymentMethod="Cash"
            items={selectedAdmission.isBoarding ? [
                {
                    name: `ค่าฝากเลี้ยง (Cage ${selectedAdmission.cage?.name})`,
                    quantity: Number(selectedAdmission.estimatedDays || 0),
                    unitPrice: Number(selectedAdmission.dailyPrice || 0),
                    totalPrice: Number(selectedAdmission.dailyPrice || 0) * Number(selectedAdmission.estimatedDays || 0)
                }
            ] : []}
            medicalRecords={[
                {
                    id: selectedAdmission.id,
                    pet: selectedAdmission.pet,
                    diagnosis: 'บริการฝากเลี้ยง (Boarding)',
                    treatment: selectedAdmission.notes,
                }
            ]}
          />
      )}

      {/* Transfer Admission Modal */}
      <Modal
        isOpen={isTransferring}
        onClose={() => setIsTransferring(false)}
        className="sm:max-w-lg rounded-3xl"
      >
        <div className="p-8 pb-4">
           <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-brand/10 rounded-2xl" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
                <Box size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">ย้ายกรง: {selectedAdmission?.pet?.name}</h3>
                <p className="text-sm text-gray-500 leading-tight">กรุณาเลือกหออภิบาลและกรงปลายทาง</p>
              </div>
           </div>

           <div className="space-y-6">
              {/* Target Ward Selection */}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">เลือกหออภิบาลปลายทาง</label>
                <div className="flex flex-wrap gap-2">
                    {wards.map(ward => (
                        <button
                            key={ward.id}
                            type="button"
                            onClick={() => setTransferTargetWardId(ward.id)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                                transferTargetWardId === ward.id
                                    ? "bg-brand/10 border-brand text-brand"
                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500"
                            )}
                            style={transferTargetWardId === ward.id ? { borderColor: brandColor, color: brandColor, backgroundColor: brandColor + '15' } : {}}
                        >
                            {ward.name}
                        </button>
                    ))}
                </div>
              </div>

              {/* Target Cage Selection */}
              {transferTargetWardId && (
                <div>
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">เลือกกรงที่ว่าง</label>
                   <div className="grid grid-cols-3 gap-2">
                      {wards.find(w => w.id === transferTargetWardId)?.cages
                       .filter(c => !c.admissions?.some(a => a.status === 'ADMITTED') || c.id === selectedAdmission?.cageId)
                       .map(cage => (
                          <button
                            key={cage.id}
                            type="button"
                            disabled={cage.id === selectedAdmission?.cageId}
                            onClick={() => selectedAdmission && handleTransfer(selectedAdmission.id, cage.id)}
                            className={cn(
                                "p-3 rounded-2xl border transition-all flex flex-col items-center gap-1 group",
                                cage.id === selectedAdmission?.cageId
                                    ? "bg-brand/5 border-brand/20 opacity-50 cursor-not-allowed"
                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand hover:bg-brand/5"
                            )}
                          >
                             <Box size={20} className={cn(
                                "group-hover:text-brand transition-colors",
                                cage.id === selectedAdmission?.cageId ? "text-brand" : "text-gray-300"
                             )} style={cage.id === selectedAdmission?.cageId ? { color: brandColor } : {}} />
                             <span className="text-xs font-black text-gray-700 dark:text-gray-300 group-hover:text-brand transition-colors">{cage.name}</span>
                          </button>
                      ))}
                      {wards.find(w => w.id === transferTargetWardId)?.cages.filter(c => !c.admissions?.some(a => a.status === 'ADMITTED')).length === 0 && (
                          <div className="col-span-3 py-6 text-center text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                             ไม่มีกรงว่างในหออภิบาลนี้
                          </div>
                      )}
                   </div>
                </div>
              )}
           </div>
        </div>

        <div className="p-8 pt-4">
          <BrandButton
            variant="ghost"
            onClick={() => setIsTransferring(false)} 
            className="w-full py-3 text-sm font-bold rounded-2xl"
          >
            ยกเลิก
          </BrandButton>
        </div>
      </Modal>

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
