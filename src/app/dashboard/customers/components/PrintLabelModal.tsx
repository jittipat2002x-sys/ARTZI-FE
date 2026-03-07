'use client';

import React from 'react';
import { useBranding } from '@/contexts/branding-context';
import { X, Languages, Printer } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { Modal } from '@/components/ui/modal';

interface PrintItem {
  name: string;
  quantity: number | string;
  usageInstructions: string;
}

interface PrintLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  customerName: string;
  items: PrintItem[];
}

export function PrintLabelModal({
  isOpen,
  onClose,
  petName,
  customerName,
  items
}: PrintLabelModalProps) {
  const { brandColor } = useBranding();

  if (!isOpen) return null;

  const translateToEN = (text: string | null | undefined) => {
    if (!text) return '';
    // Priority map for greedy replacement
    const map: [string, string][] = [
      ['วันละ 4 ครั้ง', '4 times daily'],
      ['วันละ 3 ครั้ง', '3 times daily'],
      ['วันละ 2 ครั้ง', '2 times daily'],
      ['วันละ 1 ครั้ง', '1 time daily'],
      ['ทุก 24 ชั่วโมง', 'Every 24 hours'],
      ['ทุก 12 ชั่วโมง', 'Every 12 hours'],
      ['ทุก 8 ชั่วโมง', 'Every 8 hours'],
      ['ทุก 6 ชั่วโมง', 'Every 6 hours'],
      ['ทุก 4 ชั่วโมง', 'Every 4 hours'],
      ['หลังอาหารทันที', 'Immediately after meal'],
      ['ก่อนอาหาร', 'Before Meal'],
      ['หลังอาหาร', 'After Meal'],
      ['พร้อมอาหาร', 'With Meal'],
      ['ก่อนนอน', 'At bedtime'],
      ['เมื่อมีอาการ', 'As needed'],
      ['เช้า', 'Morning'],
      ['กลางวัน', 'Noon'],
      ['เย็น', 'Evening'],
      ['เม็ด', 'Pill(s)'],
      ['แคปซูล', 'Capsule(s)'],
      ['ขวด', 'Bottle(s)'],
      ['ครั้ง', 'time(s)'],
      ['หลอด', 'Tube(s)'],
      ['แผง', 'Pack(s)'],
      ['ซอง', 'Sachet(s)'],
      ['ฝา', 'Cap(s)']
    ];

    let translated = text;
    for (const [th, en] of map) {
      translated = translated.split(th).join(en);
    }
    return translated;
  };

  const handlePrint = (mode: 'TH' | 'EN' | 'BOTH') => {
    // Create a hidden iframe for printing
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const today = new Date().toLocaleDateString('th-TH');

    const labelsHtml = items.map((item) => {
      const parts = item.usageInstructions.split('|').map(s => s.trim());
      const th = parts[0] || '';
      let en = parts[1] || '';
      
      // If English part is missing or identical to Thai (old records)
      if (!en || en === th) {
        en = translateToEN(th);
      }

      let directionsHtml = '';
      if (mode === 'BOTH') {
        directionsHtml = `
          <div style="margin-bottom: 4px;">${th}</div>
          <div style="font-style: italic; color: #666; border-top: 1px dashed #ddd; padding-top: 4px; margin-top: 4px;">${en}</div>
        `;
      } else if (mode === 'EN') {
        directionsHtml = `<div>${en}</div>`;
      } else {
        directionsHtml = `<div>${th}</div>`;
      }

      return `
        <div class="label-card">
          <div style="font-weight: bold; font-size: 18px; border-bottom: 3px solid ${brandColor}; padding-bottom: 8px; margin-bottom: 15px; text-align: center; color: ${brandColor};">
            ฉลากยา / Medication Label
          </div>
          <div style="font-size: 13px; margin-bottom: 10px; color: #444; border-bottom: 1px solid #eee; padding-bottom: 5px;">
            <div style="display: flex; justify-content: space-between;">
              <span><strong>PET:</strong> ${petName || '-'}</span>
              <span><strong>OWNER:</strong> ${customerName || '-'}</span>
            </div>
          </div>
          <div style="font-size: 15px; margin-bottom: 8px;"><strong>ITEM:</strong> ${item.name}</div>
          <div style="font-size: 15px; margin-bottom: 8px;"><strong>QTY:</strong> ${item.quantity}</div>
          <div style="font-size: 15px; margin-bottom: 8px; background: #f9f9f9; padding: 10px; border-radius: 8px; border: 1px solid #eee;">
            <strong style="color: ${brandColor}; display: block; margin-bottom: 4px; font-size: 12px; border-bottom: 1px solid ${brandColor}20;">DIRECTIONS:</strong> 
            <div style="outline: none;">
              ${directionsHtml}
            </div>
          </div>
          <div style="margin-top: 15px; font-size: 10px; color: #888; text-align: right; border-top: 1px solid #f0f0f0; padding-top: 5px;">
            DATE: ${today}
          </div>
        </div>
      `;
    }).join('');

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print Label</title>
          <style>
            @page { margin: 5mm; }
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; }
            .label-card { background: white; border: 1px solid #000; padding: 20px; width: 80mm; min-height: 50mm; box-sizing: border-box; margin-bottom: 10mm; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    doc.close();

    // Give a bit of time for the print dialog to open before closing modal
    setTimeout(() => {
      onClose();
    }, 100);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="sm:max-w-md" wrapperClassName="!z-[130]">
      <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 sm:mx-0 sm:h-10 sm:w-10">
            <Printer className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-2" id="modal-title">
              พิมพ์ฉลากยา
            </h3>
            <div className="mt-2 mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                เลือกภาษาที่ต้องการใช้พิมพ์ฉลาก
              </p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                พบ {items.length} รายการที่ต้องการพิมพ์สำหรับ <strong>{petName}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handlePrint('TH')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all group bg-white dark:bg-gray-800 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 group-hover:text-blue-600">TH</div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">ภาษาไทย (Thai)</p>
                    <p className="text-xs text-gray-500">พิมพ์ฉลากเป็นภาษาไทยเท่านั้น</p>
                  </div>
                </div>
                <Printer size={16} className="text-gray-400 group-hover:text-blue-500" />
              </button>

              <button
                onClick={() => handlePrint('EN')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all group bg-white dark:bg-gray-800 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 group-hover:text-blue-600">EN</div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">English</p>
                    <p className="text-xs text-gray-500">พิมพ์ฉลากเป็นภาษาอังกฤษเท่านั้น</p>
                  </div>
                </div>
                <Printer size={16} className="text-gray-400 group-hover:text-blue-500" />
              </button>

              <button
                onClick={() => handlePrint('BOTH')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all group bg-white dark:bg-gray-800 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center font-bold text-blue-600 group-hover:text-blue-700">双</div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Bilingual (TH + EN)</p>
                    <p className="text-xs text-gray-500">พิมพ์ทั้งสองภาษาในฉลากเดียว</p>
                  </div>
                </div>
                <Printer size={16} className="text-gray-400 group-hover:text-blue-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <button
          type="button"
          className="inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:ml-3 sm:w-auto transition-colors"
          onClick={onClose}
        >
          ปิด (Close)
        </button>
      </div>
    </Modal>
  );
}
