import React, { useState, useEffect } from 'react';
import { useBranding } from '@/contexts/branding-context';
import { AlertCircle, X, User, Calendar as CalendarIcon, Clock, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandInput } from '@/components/ui/brand-input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { customerService, Customer, Pet } from '@/services/customer.service';
import { appointmentService } from '@/services/appointment.service';
import { ThaiDateInput } from '@/components/ui/thai-date-input';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface PetFormData {
  name: string;
  species: string;
  breed: string;
  sex: string;
  birthDate: string;
  color: string;
  weight: number;
  tagId: string;
}

const emptyPet: PetFormData = {
  name: '',
  species: 'สุนัข',
  breed: '',
  sex: 'M',
  birthDate: '',
  color: '',
  weight: 0,
  tagId: ''
};

interface CreateAppointmentFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  initialDate?: string;
}

export function CreateAppointmentForm({ onCancel, onSuccess, initialDate }: CreateAppointmentFormProps) {
  const { brandColor } = useBranding();
  
  // Modes: 'EXISTING' or 'NEW'
  const [mode, setMode] = useState<'EXISTING' | 'NEW'>('EXISTING');

  // Customer/Pet State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  
  // For New Customer Mode
  const [newCustomer, setNewCustomer] = useState({ firstName: '', lastName: '', phone: '', email: '', lineId: '', address: '' });
  const [petsData, setPetsData] = useState<PetFormData[]>([{ ...emptyPet }]);
  const [expandedPetIndex, setExpandedPetIndex] = useState<number | null>(0);

  // Appointment State
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [vetId, setVetId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCustomers();
    resetForm();
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getCustomers(1, 100);
      setCustomers(response.data || []);
    } catch (err) {
      console.error('Failed to load customers for modal', err);
    }
  };

  const resetForm = () => {
    setMode('EXISTING');
    setSelectedCustomerId('');
    setSelectedPetIds([]);
    setNewCustomer({ firstName: '', lastName: '', phone: '', email: '', lineId: '', address: '' });
    setPetsData([{ ...emptyPet }]);
    setExpandedPetIndex(0);
    setDate('');
    setTime('');
    setReason('');
    setVetId('');
    setError('');
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const addPet = () => {
    const newIndex = petsData.length;
    setPetsData([...petsData, { ...emptyPet }]);
    setExpandedPetIndex(newIndex);
  };

  const removePet = (index: number) => {
    if (petsData.length <= 1) return;
    setPetsData(petsData.filter((_, i) => i !== index));
    if (expandedPetIndex === index) setExpandedPetIndex(null);
    else if (expandedPetIndex !== null && expandedPetIndex > index) setExpandedPetIndex(expandedPetIndex - 1);
  };

  const updatePet = (index: number, field: keyof PetFormData, value: string | number) => {
    const updated = [...petsData];
    updated[index] = { ...updated[index], [field]: value as never };
    setPetsData(updated);
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!date || !time || !reason) {
      setError('กรุณากรอกวันที่ เวลา และเหตุผลการนัดหมายให้ครบถ้วน');
      return;
    }

    setLoading(true);

    try {
      let finalPetIds = [...selectedPetIds];

      if (mode === 'NEW') {
        if (!newCustomer.firstName || !newCustomer.phone || petsData.some(p => !p.name)) {
          setError('กรุณากรอกข้อมูลลูกค้าใหม่และสัตว์เลี้ยงให้ครบถ้วน (ชื่อ, เบอร์โทร, ชื่อสัตว์ทุกตัว)');
          setLoading(false);
          return;
        }

        // 1. Create new customer natively
        const createdCustomer = await customerService.createCustomer({
          firstName: newCustomer.firstName,
          lastName: newCustomer.lastName,
          phone: newCustomer.phone || undefined,
          email: newCustomer.email || undefined,
          lineId: newCustomer.lineId || undefined,
          address: newCustomer.address || undefined,
        });

        // 2. Create the associated pets over loop
        finalPetIds = [];
        for (const pet of petsData) {
          const createdPet = await customerService.createPet(createdCustomer.id, {
            name: pet.name,
            species: pet.species,
            breed: pet.breed || undefined,
            sex: pet.sex || undefined,
            birthDate: pet.birthDate ? new Date(pet.birthDate).toISOString() : undefined,
            color: pet.color || undefined,
            weight: pet.weight ? Number(pet.weight) : undefined,
            tagId: pet.tagId || undefined,
          });
          finalPetIds.push(createdPet.id);
        }
      } else {
        if (finalPetIds.length === 0) {
          setError('กรุณาเลือกสัตว์เลี้ยงที่ต้องการนัดหมายอย่างน้อย 1 ตัว');
          setLoading(false);
          return;
        }
      }

      // Combine Date & Time
      const appointmentDate = new Date(`${date}T${time}:00.000+07:00`).toISOString();

      await appointmentService.createAppointment({
        petIds: finalPetIds,
        vetId: vetId ? vetId : undefined,
        date: appointmentDate,
        reason: reason
      });

      onSuccess();
      onCancel();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Failed to create appointment', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างนัดหมาย');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col w-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
              <CalendarIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">เพิ่มนัดหมายใหม่</h2>
              <p className="text-sm text-gray-500">สร้างนัดหมายล่วงหน้า</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-[400px] pb-32">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-800/50 rounded-lg flex gap-2 items-start text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <button
              onClick={() => setMode('EXISTING')}
              className="flex-1 py-1.5 text-sm font-medium rounded-md transition-all"
              style={mode === 'EXISTING' ? { backgroundColor: 'white', color: brandColor, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' } : { color: '#6B7280' }}
            >
              เลือกลูกค้าเดิม
            </button>
            <button
              onClick={() => setMode('NEW')}
              className="flex-1 py-1.5 text-sm font-medium rounded-md transition-all"
              style={mode === 'NEW' ? { backgroundColor: 'white', color: brandColor, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' } : { color: '#6B7280' }}
            >
              เพิ่มลูกค้าใหม่
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Customer & Pet */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                <User size={16} className="text-gray-400" />
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">ข้อมูลลูกค้าและสัตว์เลี้ยง</h3>
              </div>

              {mode === 'EXISTING' ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">ค้นหาลูกค้า</label>
                    <SearchableSelect
                      options={customers.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName || ''} ${c.phone ? `(${c.phone})` : ''}` }))}
                      value={selectedCustomerId}
                      onChange={(val) => {
                        setSelectedCustomerId(val);
                        const customer = customers.find(c => c.id === val);
                        if (customer && customer.pets && customer.pets.length === 1) {
                          setSelectedPetIds([customer.pets[0].id]);
                        } else {
                          setSelectedPetIds([]);
                        }
                      }}
                      placeholder="เลือกลูกค้า..."
                    />
                  </div>
                  {selectedCustomer && selectedCustomer.pets && selectedCustomer.pets.length > 0 ? (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">เลือกสัตว์เลี้ยง</label>
                      <SearchableSelect
                        options={selectedCustomer.pets.map((p: Pet) => ({ id: p.id, name: `${p.name} (${p.species})` }))}
                        value={selectedPetIds}
                        onChange={setSelectedPetIds}
                        placeholder="เลือกสัตว์เลี้ยง (เลือกได้หลายตัว)..."
                        multiple={true}
                      />
                    </div>
                  ) : selectedCustomer ? (
                     <p className="text-xs text-orange-500">ไม่พบสัตว์เลี้ยงสำหรับลูกค้ารายนี้</p>
                  ) : null}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <BrandInput
                      label="ชื่อ (ลูกค้า)"
                      required
                      value={newCustomer.firstName}
                      onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                      placeholder="สมชาย"
                    />
                    <BrandInput
                      label="นามสกุล"
                      required
                      value={newCustomer.lastName}
                      onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                      placeholder="รักสัตว์"
                    />
                    <BrandInput
                      label="เบอร์โทรศัพท์"
                      required
                      type="tel"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      placeholder="081-234-5678"
                    />
                    <BrandInput
                      label="อีเมล"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      placeholder="example@email.com"
                    />
                    <BrandInput
                      label="LINE ID"
                      value={newCustomer.lineId}
                      onChange={(e) => setNewCustomer({ ...newCustomer, lineId: e.target.value })}
                      placeholder="@line_id"
                    />
                    <BrandInput
                      label="ที่อยู่"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      placeholder="ที่อยู่ลูกค้า"
                    />
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">ข้อมูลสัตว์เลี้ยง ({petsData.length} ตัว)</h4>
                      <button
                        type="button"
                        onClick={addPet}
                        className="flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ color: brandColor }}
                      >
                        <Plus size={14} /> เพิ่มสัตว์เลี้ยง
                      </button>
                    </div>

                    <div className="space-y-3">
                      {petsData.map((pet, index) => {
                        const isExpanded = expandedPetIndex === index;
                        return (
                          <div key={index} className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div
                              onClick={() => setExpandedPetIndex(isExpanded ? null : index)}
                              className={cn(
                                "flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                                isExpanded ? "bg-gray-50/80 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" : ""
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]"
                                  style={{ backgroundColor: `${brandColor}1A`, color: brandColor }}
                                >
                                  {index + 1}
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white text-xs">
                                  {pet.name || `สัตว์เลี้ยงใหม่ตัวที่ ${index + 1}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {!isExpanded && petsData.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removePet(index); }}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                                <div className="p-1 text-gray-400">
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                              </div>
                            </div>

                            <div className={cn(
                              "transition-all duration-300 origin-top overflow-hidden",
                              isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                            )}>
                              <div className="p-4 bg-gray-50/30 dark:bg-gray-900/50 grid grid-cols-2 gap-4">
                                {petsData.length > 1 && (
                                  <div className="col-span-2 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => removePet(index)}
                                      className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded bg-red-50 dark:bg-red-900/20"
                                    >
                                      <Trash2 size={12} /> ลบแบบฟอร์มสัตว์เลี้ยงตัวนี้
                                    </button>
                                  </div>
                                )}
                                
                                <div className="col-span-2">
                                  <BrandInput
                                    label="ชื่อสัตว์เลี้ยง"
                                    required={index === 0}
                                    value={pet.name}
                                    onChange={(e) => updatePet(index, 'name', e.target.value)}
                                    placeholder="เช่น ปุยฝ้าย, ด่าง"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">ชนิดสัตว์ <span className="text-red-500">*</span></label>
                                  <select
                                    value={pet.species}
                                    onChange={(e) => updatePet(index, 'species', e.target.value)}
                                    className="w-full px-4 py-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none transition-all"
                                    onFocus={(e) => {
                                      e.currentTarget.style.borderColor = brandColor;
                                      e.currentTarget.style.boxShadow = `0 0 0 2px ${brandColor}33`;
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.borderColor = '';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    <option value="สุนัข">สุนัข</option>
                                    <option value="แมว">แมว</option>
                                    <option value="นก">นก</option>
                                    <option value="กระต่าย">กระต่าย</option>
                                    <option value="อื่นๆ">อื่นๆ</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">เพศ</label>
                                  <select
                                    value={pet.sex}
                                    onChange={(e) => updatePet(index, 'sex', e.target.value)}
                                    className="w-full px-4 py-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none transition-all"
                                    onFocus={(e) => {
                                      e.currentTarget.style.borderColor = brandColor;
                                      e.currentTarget.style.boxShadow = `0 0 0 2px ${brandColor}33`;
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.borderColor = '';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    <option value="M">ผู้ (Male)</option>
                                    <option value="F">เมีย (Female)</option>
                                    <option value="N">ทำหมัน (Neutered)</option>
                                    <option value="S">ทำหมัน/ตัวเมีย (Spayed)</option>
                                  </select>
                                </div>
                                <BrandInput
                                  label="สายพันธุ์"
                                  value={pet.breed}
                                  onChange={(e) => updatePet(index, 'breed', e.target.value)}
                                />
                                <BrandInput
                                  label="สี/ตำหนิ"
                                  value={pet.color}
                                  onChange={(e) => updatePet(index, 'color', e.target.value)}
                                />
                                <div className="space-y-2">
                                  <ThaiDateInput
                                    label="วันเกิด"
                                    value={pet.birthDate}
                                    onChange={(val) => updatePet(index, 'birthDate', val)}
                                  />
                                </div>
                                <BrandInput
                                  label="น้ำหนัก (กก.)"
                                  type="number"
                                  value={pet.weight === 0 ? '' : pet.weight}
                                  onChange={(e) => updatePet(index, 'weight', parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                />
                                <div className="col-span-2">
                                  <BrandInput
                                    label="รหัสประจำตัวสัตว์ (Tag ID) / Microchip"
                                    value={pet.tagId}
                                    onChange={(e) => updatePet(index, 'tagId', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Appointment Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                <Clock size={16} className="text-gray-400" />
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">รายละเอียดนัดหมาย</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <ThaiDateInput
                    label="วันที่"
                    value={date}
                    onChange={(val) => setDate(val)}
                  />
                </div>
                <div>
                  <BrandInput
                    label="เวลา"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <BrandInput
                  label="เหตุผลการนัดหมาย"
                  multiline
                  rows={3}
                  className="resize-none"
                  placeholder="ระบุเหตุผลการนัดหมาย (เช่น ฉีดวัคซีน, ติดตามอาการ)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <BrandButton
            onClick={handleSubmit}
            loading={loading}
            className="px-6"
          >
            สร้างนัดหมาย
          </BrandButton>
        </div>
      </div>
  );
}
