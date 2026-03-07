'use client';

import React, { useEffect, useState } from 'react';
import { masterDataService, MasterUnit, MasterUsageInstruction } from '@/services/master-data.service';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandInput } from '@/components/ui/brand-input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useBranding } from '@/contexts/branding-context';
import { X, Pill, Ruler, Clock } from 'lucide-react';

interface MedicationUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (instruction: string, structuredData: any) => void;
  initialValue?: string;
  initialData?: any;
  inventoryName?: string;
}

export function MedicationUsageModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialValue,
  initialData,
  inventoryName 
}: MedicationUsageModalProps) {
  const { brandColor } = useBranding();
  const [units, setUnits] = useState<MasterUnit[]>([]);
  const [frequencies, setFrequencies] = useState<MasterUsageInstruction[]>([]);
  const [times, setTimes] = useState<MasterUsageInstruction[]>([]);
  
  const [formData, setFormData] = useState({
    usageAmount: '',
    usageUnitId: '',
    usageFrequencyId: '',
    usageTimeId: '',
    usageMorning: false,
    usageNoon: false,
    usageEvening: false,
    usageNight: false,
    usageRemark: ''
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        usageAmount: initialData.usageAmount || '',
        usageUnitId: initialData.usageUnitId || '',
        usageFrequencyId: initialData.usageFrequencyId || '',
        usageTimeId: initialData.usageTimeId || '',
        usageMorning: !!initialData.usageMorning,
        usageNoon: !!initialData.usageNoon,
        usageEvening: !!initialData.usageEvening,
        usageNight: !!initialData.usageNight,
        usageRemark: initialData.usageRemark || ''
      });
    } else if (isOpen && !initialData) {
      // Reset if no initial data
      setFormData({
        usageAmount: '',
        usageUnitId: '',
        usageFrequencyId: '',
        usageTimeId: '',
        usageMorning: false,
        usageNoon: false,
        usageEvening: false,
        usageNight: false,
        usageRemark: ''
      });
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [u, i] = await Promise.all([
            masterDataService.getUnits(),
            masterDataService.getUsageInstructions()
          ]);
          setUnits(u);
          setFrequencies(i.filter(item => item.type === 'FREQUENCY'));
          setTimes(i.filter(item => item.type === 'TIME'));
        } catch (err) {
          console.error('Failed to load master data', err);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const generatePreviewTH = () => {
    const unit = units.find(u => u.id === formData.usageUnitId)?.nameTh || '';
    const frequency = frequencies.find(f => f.id === formData.usageFrequencyId)?.nameTh || '';
    const time = times.find(t => t.id === formData.usageTimeId)?.nameTh || '';
    
    const periods = [
      formData.usageMorning && 'เช้า',
      formData.usageNoon && 'กลางวัน',
      formData.usageEvening && 'เย็น',
      formData.usageNight && 'ก่อนนอน'
    ].filter(Boolean).join(', ');

    let components = [];
    if (formData.usageAmount) components.push(formData.usageAmount);
    if (unit) components.push(unit);
    if (frequency) components.push(frequency);
    
    let text = components.join(' ');
    if (periods) text += ` (${periods})`;
    if (time) text += ` ${time}`;
    
    if (formData.usageRemark) {
      const remarkParts = formData.usageRemark.split('|').map(s => s.trim());
      text += ` - ${remarkParts[0]}`;
    }
    
    return text.trim();
  };

  const translateToEN = (text: string | null | undefined) => {
    if (!text) return '';
    const map: Record<string, string> = {
      // Units
      'เม็ด': 'Pill(s)',
      'แคปซูล': 'Capsule(s)',
      'ขวด': 'Bottle(s)',
      'cc': 'cc',
      'ml': 'ml',
      'ครั้ง': 'time(s)',
      'หลอด': 'Tube(s)',
      'แผง': 'Pack(s)',
      'ซอง': 'Sachet(s)',
      'ฝา': 'Cap(s)',
      
      // Frequencies
      'วันละ 1 ครั้ง': '1 time daily',
      'วันละ 2 ครั้ง': '2 times daily',
      'วันละ 3 ครั้ง': '3 times daily',
      'วันละ 4 ครั้ง': '4 times daily',
      'ทุก 4 ชั่วโมง': 'Every 4 hours',
      'ทุก 6 ชั่วโมง': 'Every 6 hours',
      'ทุก 8 ชั่วโมง': 'Every 8 hours',
      'ทุก 12 ชั่วโมง': 'Every 12 hours',
      'ทุก 24 ชั่วโมง': 'Every 24 hours',
      
      // Times
      'ก่อนอาหาร': 'Before Meal',
      'หลังอาหาร': 'After Meal',
      'พร้อมอาหาร': 'With Meal',
      'หลังอาหารทันที': 'Immediately after meal',
      'ก่อนนอน': 'At bedtime',
      'เมื่อมีอาการ': 'As needed',
      'ทาบริเวณที่เป็น': 'Apply to affected area',
      'หยอดตา': 'Eye drops',
      'หยอดหู': 'Ear drops',
      'พ่นจมูก': 'Nasal spray',
    };
    return map[text] || text;
  };

  const generatePreviewEN = () => {
    const unitObj = units.find(u => u.id === formData.usageUnitId);
    const unit = unitObj?.nameEn || translateToEN(unitObj?.nameTh);
    const freqObj = frequencies.find(f => f.id === formData.usageFrequencyId);
    const frequency = freqObj?.nameEn || translateToEN(freqObj?.nameTh);
    const timeObj = times.find(t => t.id === formData.usageTimeId);
    const time = timeObj?.nameEn || translateToEN(timeObj?.nameTh);
    
    const periods = [
      formData.usageMorning && 'Morning',
      formData.usageNoon && 'Noon',
      formData.usageEvening && 'Evening',
      formData.usageNight && 'Before Bed'
    ].filter(Boolean).join(', ');

    let components = [];
    if (formData.usageAmount) components.push(`Take ${formData.usageAmount}`);
    if (unit) components.push(unit);
    if (frequency) components.push(frequency);
    
    let text = components.join(' ');
    if (periods) text += ` (${periods})`;
    if (time) text += ` ${time}`;
    
    if (formData.usageRemark) {
      const remarkParts = formData.usageRemark.split('|').map(s => s.trim());
      // If there is an English part (after |), use it. Otherwise use the whole thing (default)
      const remarkEN = remarkParts.length > 1 ? remarkParts[1] : remarkParts[0];
      text += ` - ${remarkEN}`;
    }
    
    return text.trim();
  };

  const handleSave = () => {
    const th = generatePreviewTH();
    const en = generatePreviewEN();
    // Save in format: Thai | English
    // Always include BOTH even if English is partial, to avoid parsing issues
    const instruction = `${th} | ${en}`;
    onSave(instruction, formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900/95 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-white/10 animate-in zoom-in-95 duration-300 my-auto">
        <div className="p-8 pb-6 border-b border-gray-50 dark:border-white/5">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 shrink-0 ring-8 ring-white dark:ring-gray-900 shadow-sm">
              <Pill size={24} />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 leading-tight">ตั้งค่าวิธีใชยา (Usage)</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">กำหนดปริมาณและความถี่ในการยาสำหรับ {inventoryName}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BrandInput
              label="รับประทานครั้งละ"
              placeholder="0.5, 1"
              value={formData.usageAmount}
              onChange={e => setFormData({ ...formData, usageAmount: e.target.value })}
            />
            <div className="space-y-0">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">หน่วย</label>
              <SearchableSelect
                options={units.map(u => ({ id: u.id, name: u.nameTh }))}
                value={formData.usageUnitId}
                onChange={val => setFormData({ ...formData, usageUnitId: val })}
                placeholder="เลือกหน่วย"
                icon={Ruler}
              />
            </div>
            <div className="space-y-0">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">ความถี่</label>
              <SearchableSelect
                options={frequencies.map(f => ({ id: f.id, name: f.nameTh }))}
                value={formData.usageFrequencyId}
                onChange={val => setFormData({ ...formData, usageFrequencyId: val })}
                placeholder="เลือกความถี่"
                icon={Clock}
              />
            </div>
          </div>

          <div className="space-y-0">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">เวลาที่ทาน</label>
            <SearchableSelect
              options={times.map(t => ({ id: t.id, name: t.nameTh }))}
              value={formData.usageTimeId}
              onChange={val => setFormData({ ...formData, usageTimeId: val })}
              placeholder="เลือกเวลาทาน"
              icon={Clock}
            />
          </div>

          <div className="flex flex-wrap gap-4 py-3 border-y border-gray-50 dark:border-gray-800">
            {['Morning', 'Noon', 'Evening', 'Night'].map((period) => (
              <label key={period} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(formData as any)[`usage${period}`]}
                  onChange={e => setFormData({ ...formData, [`usage${period}`]: e.target.checked })}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: brandColor }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {period === 'Morning' ? 'เช้า' : period === 'Noon' ? 'กลางวัน' : period === 'Evening' ? 'เย็น' : 'ก่อนนอน'}
                </span>
              </label>
            ))}
          </div>

          <BrandInput
            label="หมายเหตุเพิ่มเติม"
            placeholder="เช่น หยุดยาเมื่อหมดอาการ"
            value={formData.usageRemark}
            onChange={e => setFormData({ ...formData, usageRemark: e.target.value })}
          />

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preview (Thai)</span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {generatePreviewTH() || 'กำลังสร้างข้อมูลการใช้ยา...'}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: brandColor }}>Preview (English)</span>
              <p className="text-sm font-semibold" style={{ color: brandColor }}>
                {generatePreviewEN() || 'Generating...'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-50 dark:border-gray-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">ยกเลิก</button>
          <BrandButton onClick={handleSave}>ตกลง</BrandButton>
        </div>
      </div>
    </div>
  );
}
