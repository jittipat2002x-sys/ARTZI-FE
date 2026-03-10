'use client';

import React, { useEffect } from 'react';
import { inventoryService, InventoryItem } from '@/services/inventory.service';
import { masterDataService, MasterProductCategory, MasterMedicineCategory, MasterUnit, MasterUsageInstruction } from '@/services/master-data.service';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandInput } from '@/components/ui/brand-input';
import { BrandTextarea } from '@/components/ui/brand-textarea';
import { useBranding } from '@/contexts/branding-context';
import { X, LayoutGrid, Pill, Building2, Package, Ruler, Clock } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ThaiDateInput } from '@/components/ui/thai-date-input';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: InventoryItem | null;
  branchId: string;
  branches: any[];
  onSuccess: () => void;
}


export function InventoryModal({ isOpen, onClose, initialData, branchId, branches, onSuccess }: InventoryModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const { brandColor } = useBranding();

  // Master Data Options
  const [productCats, setProductCats] = React.useState<MasterProductCategory[]>([]);
  const [medicineCats, setMedicineCats] = React.useState<MasterMedicineCategory[]>([]);
  const [allUnits, setAllUnits] = React.useState<MasterUnit[]>([]);
  const [filteredUnits, setFilteredUnits] = React.useState<MasterUnit[]>([]);
  const [usageFrequencies, setUsageFrequencies] = React.useState<MasterUsageInstruction[]>([]);
  const [usageTimes, setUsageTimes] = React.useState<MasterUsageInstruction[]>([]);
  
  const [formData, setFormData] = React.useState<Partial<InventoryItem>>({
    name: '',
    type: 'MEDICINE',
    categoryId: '',
    masterMedicineCategoryId: '',
    unitId: '',
    usageUnitId: '',
    usageFrequencyId: '',
    usageTimeId: '',
    medicineType: 'NONE',
    description: '',
    cost: 0,
    price: 0,
    quantity: 0,
    lowStockThreshold: 0,
    unit: '',
    lotNumber: '',
    barcode: '',
    expirationDate: '',
    branchId: '',
    usageAmount: '',
    usageUnit: '',
    usageFrequency: '',
    usageTime: 'AFTER_MEAL',
    usageMorning: false,
    usageNoon: false,
    usageEvening: false,
    usageNight: false,
    usageRemark: '',
    isActive: true,
  });

  // Load Master Data
  useEffect(() => {
    if (isOpen) {
      const loadMasterData = async () => {
        try {
          const [p, m, u, i] = await Promise.all([
            masterDataService.getProductCategories(),
            masterDataService.getMedicineCategories(),
            masterDataService.getUnits(),
            masterDataService.getUsageInstructions(),
          ]);
          setProductCats(p);
          setMedicineCats(m);
          setAllUnits(u);
          setUsageFrequencies(i.filter(item => item.type === 'FREQUENCY'));
          setUsageTimes(i.filter(item => item.type === 'TIME'));
        } catch (err) {
          console.error('Failed to load master data', err);
        }
      };
      loadMasterData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        branchId: initialData.branchId || branchId,
        expirationDate: initialData.expirationDate ? new Date(initialData.expirationDate).toISOString().split('T')[0] : '',
        lowStockThreshold: initialData.lowStockThreshold || 0,
      });
    } else {
      setFormData({
        name: '',
        type: 'MEDICINE',
        medicineType: 'NONE',
        description: '',
        cost: 0,
        price: 0,
        quantity: 0,
        lowStockThreshold: 0,
        unit: 'ออเดอร์',
        lotNumber: '',
        barcode: '',
        expirationDate: '',
        branchId: branchId || '',
        usageAmount: '',
        usageUnit: 'เม็ด',
        usageFrequency: '1',
        usageTime: 'AFTER_MEAL',
        usageMorning: true,
        usageNoon: false,
        usageEvening: false,
        usageNight: false,
        usageRemark: 'หยุดยาเมื่อหมดอาการ',
        isActive: true,
      });
    }
    setError('');
  }, [initialData, isOpen]);

  // Filter units when medicine category changes
  useEffect(() => {
    if (formData.masterMedicineCategoryId) {
      const filtered = allUnits.filter(u => !u.medicineCategoryId || u.medicineCategoryId === formData.masterMedicineCategoryId);
      setFilteredUnits(filtered);
    } else {
      setFilteredUnits(allUnits);
    }
  }, [formData.masterMedicineCategoryId, allUnits]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'number') {
      finalValue = value === '' ? 0 : parseFloat(value);
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        ...formData,
      };

      if (!payload.branchId) {
        setError('กรุณาเลือกสาขา');
        setLoading(false);
        return;
      }

      delete payload.id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.branch;
      delete payload.category;
      delete payload.masterMedicineCategory;
      delete payload.masterUnit;
      delete payload.masterUsageUnit;
      delete payload.masterUsageFrequency;
      delete payload.masterUsageTime;

      // Clean up legacy fields and set values from master data for backward compat if needed
      // Actually let the backend handle it, but we can set legacy unit strings too
      if (payload.unitId) {
          const u = allUnits.find(u => u.id === payload.unitId);
          if (u) payload.unit = u.nameTh;
      }
      
      if (payload.usageUnitId) {
          const u = allUnits.find(u => u.id === payload.usageUnitId);
          if (u) payload.usageUnit = u.nameTh;
      }

      if (payload.usageFrequencyId) {
          const f = usageFrequencies.find(f => f.id === payload.usageFrequencyId);
          if (f) payload.usageFrequency = f.nameTh;
      }

      if (payload.usageTimeId) {
          const t = usageTimes.find(t => t.id === payload.usageTimeId);
          if (t) payload.usageTime = t.nameTh;
      }

      if (payload.type === 'SERVICE') {
        payload.medicineType = 'NONE';
        delete payload.quantity;
        delete payload.cost;
        delete payload.lotNumber;
        delete payload.expirationDate;
        payload.unit = payload.unit || 'ครั้ง';
      }

      // Allow lowStockThreshold to pass through

      if (!payload.expirationDate) {
        delete payload.expirationDate;
      }

      if (initialData?.id) {
        await inventoryService.updateInventory(initialData.id, payload);
      } else {
        await inventoryService.createInventory(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isService = formData.type === 'SERVICE';
  const isMedicine = formData.type === 'MEDICINE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
              <p>{error}</p>
            </div>
          )}

          <form id="inventory-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Branch Selection */}
              {!branchId && !initialData && (
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    สาขา <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={branches.map(b => ({ id: b.id, name: b.name }))}
                    value={formData.branchId || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, branchId: val }))}
                    placeholder="เลือกสาขาที่จะเพิ่มรายการ..."
                    icon={Building2}
                  />
                </div>
              )}

              {/* Common Fields */}
              <div className="md:col-span-2 space-y-2">
                <BrandInput
                  label={<>ชื่อรายการ <span className="text-red-500">*</span></>}
                  name="name"
                  required
                  value={formData.name || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">หมวดหมู่สินค้า <span className="text-red-500">*</span></label>
                <SearchableSelect
                  options={productCats.map(c => ({ id: c.id, name: c.nameTh }))}
                  value={formData.categoryId || ''}
                  onChange={(val) => {
                      const cat = productCats.find(c => c.id === val);
                      setFormData(prev => ({ 
                          ...prev, 
                          categoryId: val,
                          type: cat?.nameTh === 'ยา' || cat?.nameTh === 'Medicine' ? 'MEDICINE' : 
                                cat?.nameTh === 'วัคซีน' || cat?.nameTh === 'Vaccine' ? 'VACCINE' :
                                cat?.nameTh === 'บริการ' || cat?.nameTh === 'Service' ? 'SERVICE' : 'OTHER'
                      }));
                  }}
                  placeholder="เลือกหมวดหมู่"
                  icon={Package}
                />
              </div>

              {isMedicine && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ประเภทยา <span className="text-red-500">*</span></label>
                  <SearchableSelect
                    options={medicineCats.map(c => ({ id: c.id, name: c.nameTh }))}
                    value={formData.masterMedicineCategoryId || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, masterMedicineCategoryId: val }))}
                    placeholder="เลือกประเภทยา"
                    icon={Pill}
                  />
                </div>
              )}

              <div className="space-y-2">
                <BrandInput
                  label={<>ราคาขาย (฿) <span className="text-red-500">*</span></>}
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  required
                  value={formData.price?.toString() || ''}
                  onChange={handleChange}
                />
              </div>

              {!isService && (
                <div className="space-y-2">
                  <BrandInput
                    label="ราคาทุน (฿)"
                    type="number"
                    name="cost"
                    min="0"
                    step="0.01"
                    value={formData.cost?.toString() || ''}
                    onChange={handleChange}
                  />
                </div>
              )}

              {!isService && (
                <>
                  <div className="space-y-2">
                    <BrandInput
                      label={<span>จำนวนคงเหลือ <span className="text-red-500">*</span></span>}
                      type="number"
                      name="quantity"
                      min="0"
                      required
                      value={formData.quantity?.toString() || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <BrandInput
                      label={<span>แจ้งเตือนเมื่อเหลือน้อยกว่า <span className="text-red-500">*</span></span>}
                      type="number"
                      name="lowStockThreshold"
                      min="0"
                      required
                      value={formData.lowStockThreshold?.toString() || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">หน่วยนับ <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      options={filteredUnits.map(u => ({ id: u.id, name: u.nameTh }))}
                      value={formData.unitId || ''}
                      onChange={(val) => setFormData(prev => ({ ...prev, unitId: val }))}
                      placeholder="เลือกหน่วยนับ"
                      icon={Ruler}
                    />
                  </div>

                  <div className="space-y-2">
                    <BrandInput
                      label="หมายเลขล็อต (Lot Number)"
                      type="text"
                      name="lotNumber"
                      value={formData.lotNumber || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">วันหมดอายุ</label>
                    <ThaiDateInput
                      value={formData.expirationDate || ''}
                      onChange={(val) => setFormData(prev => ({ ...prev, expirationDate: val }))}
                    />
                  </div>
                </>
              )}

              {isMedicine && (
                <div 
                  className="md:col-span-2 p-4 rounded-2xl border space-y-4"
                  style={{ backgroundColor: `${brandColor}10`, borderColor: `${brandColor}1A` }}
                >
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: brandColor }}>
                    <Pill size={16} />
                    ข้อมูลการใช้ยา (Drug Usage Instructions)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <BrandInput
                      label="รับประทานครั้งละ"
                      name="usageAmount"
                      placeholder="เช่น 0.5, 1"
                      value={formData.usageAmount || ''}
                      onChange={handleChange}
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">หน่วยที่ทาน</label>
                      <SearchableSelect
                        options={filteredUnits.map(u => ({ id: u.id, name: u.nameTh }))}
                        value={formData.usageUnitId || ''}
                        onChange={(val) => setFormData(prev => ({ ...prev, usageUnitId: val }))}
                        placeholder="เลือกหน่วย"
                        icon={Ruler}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">วันละกี่ครั้ง</label>
                      <SearchableSelect
                        options={usageFrequencies.map(f => ({ id: f.id, name: f.nameTh }))}
                        value={formData.usageFrequencyId || ''}
                        onChange={(val) => setFormData(prev => ({ ...prev, usageFrequencyId: val }))}
                        placeholder="เลือกความถี่"
                        icon={Clock}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">เวลาที่ทาน</label>
                    <SearchableSelect
                        options={usageTimes.map(t => ({ id: t.id, name: t.nameTh }))}
                        value={formData.usageTimeId || ''}
                        onChange={(val) => setFormData(prev => ({ ...prev, usageTimeId: val }))}
                        placeholder="เลือกเวลาทาน"
                        icon={Clock}
                    />
                  </div>

                  <div className="flex flex-wrap gap-6 items-center py-2 border-y" style={{ borderColor: `${brandColor}1A` }}>
                    <div className="flex items-center gap-4">
                      {['Morning', 'Noon', 'Evening', 'Night'].map((period) => (
                        <label key={period} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={(formData as any)[`usage${period}`]}
                            onChange={(e) => setFormData(prev => ({ ...prev, [`usage${period}`]: e.target.checked }))}
                            className="w-4 h-4 rounded text-brand bg-transparent border-gray-300 dark:border-gray-600 focus:ring-brand"
                            style={{ accentColor: brandColor }}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-brand transition-colors">
                            {period === 'Morning' ? 'เช้า' : period === 'Noon' ? 'กลางวัน' : period === 'Evening' ? 'เย็น' : 'ก่อนนอน'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <BrandInput
                    label="คำสั่งเพิ่มเติม/หมายเหตุการใช้ยา"
                    name="usageRemark"
                    placeholder="เช่น กินติดต่อกันจนหมด, หยุดยาเมื่อหมดอาการ"
                    value={formData.usageRemark || ''}
                    onChange={handleChange}
                  />

                  {/* usage preview */}
                  <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700 space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Preview (Thai)</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {formData.usageAmount} {allUnits.find(u => u.id === formData.usageUnitId)?.nameTh || ''} {usageFrequencies.find(f => f.id === formData.usageFrequencyId)?.nameTh || ''} {(formData.usageMorning || formData.usageNoon || formData.usageEvening || formData.usageNight) ? '(' + [formData.usageMorning && 'เช้า', formData.usageNoon && 'กลางวัน', formData.usageEvening && 'เย็น', formData.usageNight && 'ก่อนนอน'].filter(Boolean).join(', ') + ')' : ''} {usageTimes.find(t => t.id === formData.usageTimeId)?.nameTh || ''} {formData.usageRemark ? `- ${formData.usageRemark}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider" style={{ color: brandColor }}>Preview (English)</span>
                      <p className="text-sm font-semibold" style={{ color: brandColor }}>
                        Take {formData.usageAmount} {allUnits.find(u => u.id === formData.usageUnitId)?.nameEn || allUnits.find(u => u.id === formData.usageUnitId)?.nameTh || ''} {usageFrequencies.find(f => f.id === formData.usageFrequencyId)?.nameEn || ''} {(formData.usageMorning || formData.usageNoon || formData.usageEvening || formData.usageNight) ? '(' + [formData.usageMorning && 'Morning', formData.usageNoon && 'Noon', formData.usageEvening && 'Evening', formData.usageNight && 'Before Bed'].filter(Boolean).join(', ') + ')' : ''} {usageTimes.find(t => t.id === formData.usageTimeId)?.nameEn || ''} {formData.usageRemark ? `- ${formData.usageRemark}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="md:col-span-2 space-y-2 mt-4">
                <BrandInput
                  label="รหัสบาร์โค้ด (ถ้ามี)"
                  name="barcode"
                  placeholder="สแกนหรือพิมพ์รหัสบาร์โค้ด"
                  value={formData.barcode || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <BrandTextarea
                  name="description"
                  rows={3}
                  label="รายละเอียดเพิ่มเติม"
                  value={formData.description || ''}
                  onChange={handleChange as any}
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-5 h-5 rounded text-brand bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-brand"
                    style={{ accentColor: brandColor }}
                />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                    เปิดใช้งานรายการนี้
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ยกเลิก
          </button>
          <BrandButton
            type="submit"
            form="inventory-form"
            loading={loading}
          >
            บันทึกข้อมูล
          </BrandButton>
        </div>
      </div>
    </div>
  );
}
