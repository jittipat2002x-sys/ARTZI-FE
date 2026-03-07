import React, { useState, useEffect } from 'react';
import { InventoryItem, inventoryService } from '@/services/inventory.service';
import { authService } from '@/services/auth.service';
import { useBranding } from '@/contexts/branding-context';
import { Search, Plus, Trash2, Printer, PencilLine } from 'lucide-react';
import { BrandInput } from '@/components/ui/brand-input';
import { MedicationUsageModal } from './MedicationUsageModal';
import { PrintLabelModal } from './PrintLabelModal';

export interface SelectedMedication {
  inventoryId: string;
  inventoryName: string;
  quantity: number;
  unitPrice: number;
  usageInstructions: string;
  // Structured usage data for editing in modal
  usageAmount?: string;
  usageUnitId?: string;
  usageFrequencyId?: string;
  usageTimeId?: string;
  usageMorning?: boolean;
  usageNoon?: boolean;
  usageEvening?: boolean;
  usageNight?: boolean;
  usageRemark?: string;
}

interface PetMedicineSelectorProps {
  selectedItems: SelectedMedication[];
  onChange: (items: SelectedMedication[]) => void;
  petName?: string;
  customerName?: string;
}

export function PetMedicineSelector({ selectedItems, onChange, petName, customerName }: PetMedicineSelectorProps) {
  const { brandColor } = useBranding();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Usage Modal State
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [activeUsageIdx, setActiveUsageIdx] = useState<number | null>(null);
  const [activeUsageName, setActiveUsageName] = useState('');

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingItem, setPrintingItem] = useState<SelectedMedication | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search.length >= 2) {
        searchInventory();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const searchInventory = async () => {
    setIsSearching(true);
    try {
      const user = authService.getUser();
      const branchId = user?.branches?.[0]?.branchId;
      // Fetching MEDICINE, VACCINE, and SERVICE specifically
      const res = await inventoryService.getInventories(branchId, '', '', search, 1, 10);
      setResults(res.data);
    } catch (error) {
      console.error('Failed to search inventory:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatDefaultUsage = (item: InventoryItem) => {
    if (item.type !== 'MEDICINE' && item.type !== 'VACCINE') return '';
    
    // Thai Preview
    const unitTh = item.masterUsageUnit?.nameTh || item.usageUnit || '';
    const frequencyTh = item.masterUsageFrequency?.nameTh || item.usageFrequency || '';
    const timeTh = item.masterUsageTime?.nameTh || (item.usageTime === 'AFTER_MEAL' ? 'หลังอาหาร' : item.usageTime === 'BEFORE_MEAL' ? 'ก่อนอาหาร' : '');
    const periodsTh = [
      item.usageMorning && 'เช้า',
      item.usageNoon && 'กลางวัน',
      item.usageEvening && 'เย็น',
      item.usageNight && 'ก่อนนอน'
    ].filter(Boolean).join(', ');

    let componentsTh = [];
    if (item.usageAmount) componentsTh.push(item.usageAmount);
    if (unitTh) componentsTh.push(unitTh);
    if (frequencyTh) componentsTh.push(frequencyTh);
    
    let textTh = componentsTh.join(' ');
    if (periodsTh) textTh += ` (${periodsTh})`;
    if (timeTh) textTh += ` ${timeTh}`;
    
    if (item.usageRemark) {
      const remarkParts = item.usageRemark.split('|').map(s => s.trim());
      textTh += ` - ${remarkParts[0]}`;
    }

    // English Preview (Simple version for default)
    const unitEn = item.masterUsageUnit?.nameEn || item.usageUnit || '';
    const frequencyEn = item.masterUsageFrequency?.nameEn || item.usageFrequency || '';
    const timeEn = item.masterUsageTime?.nameEn || item.usageTime || '';
    const periodsEn = [
      item.usageMorning && 'Morning',
      item.usageNoon && 'Noon',
      item.usageEvening && 'Evening',
      item.usageNight && 'Before Bed'
    ].filter(Boolean).join(', ');

    let componentsEn = [];
    if (item.usageAmount) componentsEn.push(`Take ${item.usageAmount}`);
    if (unitEn) componentsEn.push(unitEn);
    if (frequencyEn) componentsEn.push(frequencyEn);
    
    let textEn = componentsEn.join(' ');
    if (periodsEn) textEn += ` (${periodsEn})`;
    if (timeEn) textEn += ` ${timeEn}`;
    
    if (item.usageRemark) {
      const remarkParts = item.usageRemark.split('|').map(s => s.trim());
      const remarkEn = remarkParts.length > 1 ? remarkParts[1] : remarkParts[0];
      textEn += ` - ${remarkEn}`;
    }
    
    return `${textTh.trim()} | ${textEn.trim()}`;
  };

  const addItem = (item: InventoryItem) => {
    const isAlreadyAdded = selectedItems.find(i => i.inventoryId === item.id);
    if (isAlreadyAdded) return;

    const newItem: SelectedMedication = {
      inventoryId: item.id,
      inventoryName: item.name,
      quantity: 1,
      unitPrice: item.price || 0,
      usageInstructions: formatDefaultUsage(item),
      usageAmount: item.usageAmount || '',
      usageUnitId: item.usageUnitId || '',
      usageFrequencyId: item.usageFrequencyId || '',
      usageTimeId: item.usageTimeId || '',
      usageMorning: item.usageMorning || false,
      usageNoon: item.usageNoon || false,
      usageEvening: item.usageEvening || false,
      usageNight: item.usageNight || false,
      usageRemark: item.usageRemark || ''
    };

    onChange([...selectedItems, newItem]);
    setSearch('');
    setResults([]);
  };

  const updateItem = (index: number, field: keyof SelectedMedication, value: any) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const handlePrint = (item: SelectedMedication) => {
    setPrintingItem(item);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Search Input and Results */}
      <div className="relative">
        <BrandInput
          label="รายการยาและบริการสำหรับสัตว์ตัวนี้"
          placeholder="ค้นหาชื่อยา, วัคซีน หรือ บริการ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Search Results Dropdown */}
        {search.length >= 2 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg max-h-48 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 text-sm text-gray-500 text-center">กำลังค้นหา...</div>
            ) : results.length > 0 ? (
              results.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex justify-between items-center"
                  onClick={() => addItem(item)}
                >
                  <div>
                    <span className="text-sm font-medium block">{item.name}</span>
                    <span className="text-xs text-gray-500">ประเภท: {item.type} | คงเหลือ: {item.quantity} {item.unit}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: brandColor }}>฿{item.price}</span>
                </button>
              ))
            ) : (
              <div className="p-3 text-sm text-gray-500 text-center">ไม่พบรายการสินค้า</div>
            )}
          </div>
        )}
      </div>
      {/* Selected Items Table */}
      {selectedItems.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">ชื่อรายการ</th>
                <th className="px-3 py-2 font-medium w-20">จำนวน</th>
                <th className="px-3 py-2 font-medium w-24">ราคา/หน่วย</th>
                <th className="px-3 py-2 font-medium">วิธีใช้ / หมายเหตุ</th>
                <th className="px-3 py-2 w-20 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((item, idx) => (
                <tr key={idx} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-3 py-2 font-medium">{item.inventoryName}</td>
                  <td className="px-3 py-2">
                    <BrandInput
                      type="number"
                      min="1"
                      className="text-center !py-1.5 !px-2"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <BrandInput
                      type="number"
                      className="text-right !py-1.5 !px-2"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div 
                      className="cursor-pointer group flex items-center justify-between gap-2 p-2 border border-gray-100 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 transition-colors bg-white dark:bg-gray-900"
                      onClick={() => {
                        setActiveUsageIdx(idx);
                        setActiveUsageName(item.inventoryName);
                        setIsUsageModalOpen(true);
                      }}
                    >
                      <span className={`text-xs ${item.usageInstructions ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 italic'}`}>
                        {item.usageInstructions || 'คลิกเพื่อระบุวิธีใช้...'}
                      </span>
                      <PencilLine size={14} className="text-gray-400 group-hover:text-blue-500" />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => handlePrint(item)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="พิมพ์ฉลากยา"
                      >
                        <Printer size={16} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => removeItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="ลบ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MedicationUsageModal 
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
        inventoryName={activeUsageName}
        initialData={activeUsageIdx !== null ? {
          usageAmount: selectedItems[activeUsageIdx]?.usageAmount,
          usageUnitId: selectedItems[activeUsageIdx]?.usageUnitId,
          usageFrequencyId: selectedItems[activeUsageIdx]?.usageFrequencyId,
          usageTimeId: selectedItems[activeUsageIdx]?.usageTimeId,
          usageMorning: selectedItems[activeUsageIdx]?.usageMorning,
          usageNoon: selectedItems[activeUsageIdx]?.usageNoon,
          usageEvening: selectedItems[activeUsageIdx]?.usageEvening,
          usageNight: selectedItems[activeUsageIdx]?.usageNight,
          usageRemark: selectedItems[activeUsageIdx]?.usageRemark
        } : undefined}
        onSave={(instruction, structuredData) => {
          if (activeUsageIdx !== null) {
            const newItems = [...selectedItems];
            newItems[activeUsageIdx] = {
              ...newItems[activeUsageIdx],
              usageInstructions: instruction,
              ...structuredData
            };
            onChange(newItems);
          }
        }}
      />

      {printingItem && (
        <PrintLabelModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setPrintingItem(null);
          }}
          petName={petName || ''}
          customerName={customerName || ''}
          items={[{
            name: printingItem.inventoryName,
            quantity: printingItem.quantity,
            usageInstructions: printingItem.usageInstructions
          }]}
        />
      )}
    </div>
  );
}
