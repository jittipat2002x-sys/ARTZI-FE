'use client';

import React from 'react';
import { useBranding } from '@/contexts/branding-context';
import { X, Receipt, Printer } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { Modal } from '@/components/ui/modal';

interface InvoiceItem {
  id?: string; // ID for duplicate tracking
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  medicalRecordId?: string;
  dosage?: string;
}

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  petNames: string;
  invoiceDate: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  totalAmount: number;
  discount: number;
  netAmount: number;
  paymentMethod?: string;
  medicalRecords?: any[];
}

export function PrintInvoiceModal({
  isOpen,
  onClose,
  customerName,
  petNames,
  invoiceDate,
  invoiceNumber,
  items,
  totalAmount,
  discount,
  netAmount,
  paymentMethod,
  medicalRecords
}: PrintInvoiceModalProps) {
  const { brandColor, logoUrl, branchName, tenantName } = useBranding();
  const [selectedSize, setSelectedSize] = React.useState('80mm');

  const paperSizes = [
    { id: '80mm', label: '80mm (Thermal)', width: '80mm' },
    { id: '58mm', label: '58mm (Thermal)', width: '58mm' },
    { id: 'A5', label: 'A5 (Sheet)', width: '148mm' },
  ];

  if (!isOpen) return null;

  const handlePrint = () => {
    let iframe = document.getElementById('print-invoice-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-invoice-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const renderedItemKeys = new Set<string>();
    const petBuckets: Record<string, InvoiceItem[]> = {};
    const generalBucket: InvoiceItem[] = [];

    // 1. Group items that have an explicit medicalRecordId
    items.forEach((item, index) => {
      const key = item.id || `idx-${index}`;
      if (item.medicalRecordId) {
        if (!petBuckets[item.medicalRecordId]) petBuckets[item.medicalRecordId] = [];
        petBuckets[item.medicalRecordId].push(item);
        renderedItemKeys.add(key);
      }
    });

    // 2. Fallback matching and Virtual Item strategy
    if (medicalRecords && medicalRecords.length > 0) {
      medicalRecords.forEach((record) => {
        const medications = record.medications || record.treatments || [];
        medications.forEach((med: any) => {
          const medName = med.inventory?.name || med.name;
          
          // Check if this specific medication is already "satisfied" by an item already linked to this bucket
          const isSatisfied = (petBuckets[record.id] || []).some(it => it.name === medName);
          
          if (!isSatisfied) {
            // A) Try to find a namesake in the remaining "General" items pool
            const matchIndex = items.findIndex((it, index) => {
              const key = it.id || `idx-${index}`;
              // Match by name AND check price if possible to be more accurate
              return !renderedItemKeys.has(key) && it.name === medName;
            });
            
            if (matchIndex !== -1) {
              const matchedItem = items[matchIndex];
              const key = matchedItem.id || `idx-${matchIndex}`;
              
              if (!petBuckets[record.id]) petBuckets[record.id] = [];
              petBuckets[record.id].push({
                ...matchedItem,
                dosage: med.dosage || med.usageInstructions || matchedItem.dosage
              });
              renderedItemKeys.add(key);
            } else {
              // B) VIRTUAL ITEM Strategy: Create a virtual item from the medical record if no physical item exists
              // This is an EMERGENCY fallback to ensure 100% invisibility if DB links fail.
              if (!petBuckets[record.id]) petBuckets[record.id] = [];
              
              const virtualPrice = med.unitPrice || med.inventory?.price || 0;
              const virtualQty = med.quantity || 1;
              
              petBuckets[record.id].push({
                id: `virtual-${record.id}-${medName}`,
                name: medName,
                quantity: virtualQty,
                unitPrice: virtualPrice,
                totalPrice: virtualPrice * virtualQty,
                dosage: med.dosage || med.usageInstructions
              });
              // Note: We DON'T add to renderedItemKeys because this item isn't from the 'items' prop pool
            }
          } else {
            // Just ensure the dosage is attached to the already linked item if missing
            const itemToUpdate = petBuckets[record.id].find(it => it.name === medName);
            if (itemToUpdate && !itemToUpdate.dosage) {
              itemToUpdate.dosage = med.dosage || med.usageInstructions;
            }
          }
        });
      });
    }

    // 3. Everything else goes into the General Bucket
    items.forEach((item, index) => {
      const key = item.id || `idx-${index}`;
      if (!renderedItemKeys.has(key)) {
        generalBucket.push(item);
      }
    });

    let bodyHtml = '';

    // 4. Build HTML for Pet Sections
    if (medicalRecords && medicalRecords.length > 0) {
      medicalRecords.forEach(record => {
        const recordItems = petBuckets[record.id] || [];
        if (recordItems.length === 0) return;

        const petName = record.pet?.name || 'Unknown Pet';
        
        bodyHtml += `
          <tr style="background: #f1f5f9;">
            <td colspan="4" style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">
              PATIENT / สัตว์เลี้ยง: ${petName}
            </td>
          </tr>
        `;
        
        recordItems.forEach(item => {
          bodyHtml += `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">
                <div style="font-weight: 500;">${item.name}</div>
                ${item.dosage ? `<div style="font-size: 10px; color: #666; margin-top: 2px;">วิธีใช้: ${item.dosage}</div>` : ''}
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice.toLocaleString()}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.totalPrice.toLocaleString()}</td>
            </tr>
          `;
        });
      });
    }

    // 5. Build HTML for General Items
    if (generalBucket.length > 0) {
      bodyHtml += `
        <tr style="background: #f1f5f9;">
          <td colspan="4" style="padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">
            GENERAL ITEMS / รายการทั่วไป
          </td>
        </tr>
      `;
      
      generalBucket.forEach(item => {
        bodyHtml += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice.toLocaleString()}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.totalPrice.toLocaleString()}</td>
          </tr>
        `;
      });
    }

    if (!bodyHtml) {
      // Emergency fallback if for some reason NO items were bucketed
      bodyHtml = items.map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice.toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.totalPrice.toLocaleString()}</td>
        </tr>
      `).join('');
    }

    doc.open();
    // Dynamic styles based on paper size
    let pageCss = '';
    let bodyPadding = '10px';
    let fontSizeScale = 1;
    let headerLogoHeight = '60px';

    if (selectedSize === '58mm') {
      pageCss = `@page { size: 58mm auto; margin: 0; }`;
      bodyPadding = '5px';
      fontSizeScale = 0.75;
      headerLogoHeight = '40px';
    } else if (selectedSize === '80mm') {
      pageCss = `@page { size: 80mm auto; margin: 0; }`;
      bodyPadding = '8px';
      fontSizeScale = 0.9;
      headerLogoHeight = '50px';
    } else { // A5
      pageCss = `@page { size: A5; margin: 0; }`;
      bodyPadding = '15mm';
      fontSizeScale = 1;
      headerLogoHeight = '60px';
    }

    doc.write(`
      <html>
        <head>
          <title>Invoice - ${invoiceNumber}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            ${pageCss}
            body { 
              font-family: 'Sarabun', sans-serif; 
              margin: 0; 
              padding: ${bodyPadding}; 
              color: #333; 
              font-size: ${14 * fontSizeScale}px;
              line-height: 1.2;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: ${20 * fontSizeScale}px; 
              border-bottom: ${2 * fontSizeScale}px solid ${brandColor}; 
              padding-bottom: ${10 * fontSizeScale}px; 
            }
            .logo { height: ${headerLogoHeight}; }
            .company-info { text-align: right; }
            .invoice-title { 
              font-size: ${24 * fontSizeScale}px; 
              font-weight: bold; 
              color: ${brandColor}; 
              margin-bottom: ${10 * fontSizeScale}px; 
              text-transform: uppercase; 
            }
            .details { display: flex; justify-content: space-between; margin-bottom: ${20 * fontSizeScale}px; }
            .detail-group { flex: 1; }
            .label { font-size: ${10 * fontSizeScale}px; color: #888; text-transform: uppercase; font-weight: bold; }
            .value { font-size: ${14 * fontSizeScale}px; font-weight: bold; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: ${20 * fontSizeScale}px; }
            th { 
              background: #f9f9f9; 
              padding: ${8 * fontSizeScale}px ${5 * fontSizeScale}px; 
              text-align: left; 
              font-size: ${12 * fontSizeScale}px; 
              text-transform: uppercase; 
              color: #666; 
              border-bottom: ${2 * fontSizeScale}px solid #eee; 
            }
            td {
              padding: ${8 * fontSizeScale}px ${5 * fontSizeScale}px;
              border-bottom: 1px solid #eee;
              font-size: ${13 * fontSizeScale}px;
            }
            .totals { margin-left: auto; width: ${200 * fontSizeScale}px; }
            .total-row { display: flex; justify-content: space-between; padding: ${5 * fontSizeScale}px 0; font-size: ${14 * fontSizeScale}px; }
            .grand-total { 
              border-top: ${2 * fontSizeScale}px solid ${brandColor}; 
              margin-top: ${10 * fontSizeScale}px; 
              padding-top: ${10 * fontSizeScale}px; 
              font-size: ${18 * fontSizeScale}px; 
              font-weight: bold; 
              color: ${brandColor}; 
            }
            .footer { 
              margin-top: ${30 * fontSizeScale}px; 
              text-align: center; 
              font-size: ${12 * fontSizeScale}px; 
              color: #888; 
              border-top: 1px solid #eee; 
              padding-top: ${15 * fontSizeScale}px; 
            }
            @media print {
              body { padding: ${bodyPadding}; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : `<div style="font-size: ${24 * fontSizeScale}px; font-weight: bold; color: ${brandColor}">${branchName || tenantName || 'Clinic'}</div>`}
            </div>
            <div class="company-info">
              <div class="invoice-title">ใบเสร็จรับเงิน / Invoice</div>
              <div>No: ${invoiceNumber}</div>
              <div>Date: ${invoiceDate}</div>
            </div>
          </div>

          <div class="details">
            <div class="detail-group">
              <div class="label">Customer / ลูกค้า</div>
              <div class="value">${customerName}</div>
            </div>
            <div class="detail-group">
              <div class="label">Patient / สัตว์เลี้ยง</div>
              <div class="value">${petNames}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description / รายการ</th>
                <th style="text-align: center;">Qty / จำนวน</th>
                <th style="text-align: right;">Unit Price / ราคา</th>
                <th style="text-align: right;">Amount / รวม</th>
              </tr>
            </thead>
            <tbody>
              ${bodyHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal / รวมเงิน:</span>
              <span>฿${totalAmount.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Discount / ส่วนลด:</span>
              <span>- ฿${discount.toLocaleString()}</span>
            </div>
            <div class="grand-total">
              <span>Total / สุทธิ:</span>
              <span>฿${netAmount.toLocaleString()}</span>
            </div>
          </div>


          <div class="footer">
            Thank you for choosing our services / ขอบคุณที่มาใช้บริการ
          </div>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="sm:max-w-2xl flex flex-col max-h-[90vh]" wrapperClassName="!z-[200]">
      <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4 flex-1 flex flex-col min-h-0">
        <div className="sm:flex sm:items-start shrink-0">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 sm:mx-0 sm:h-10 sm:w-10">
            <Receipt className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-2" id="modal-title">
              พิมพ์ใบเสร็จรับเงิน
            </h3>
            
            <div className="mt-4 mb-4">
              <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase tracking-wider">ขนาดกระดาษ (Paper Size)</label>
              <div className="grid grid-cols-3 gap-2">
                {paperSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    className={`py-2 px-1 text-[10px] font-bold rounded-md border transition-all ${
                      selectedSize === size.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600 ring-2 ring-emerald-500/10'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 dark:bg-gray-800'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              ตรวจสอบรายละเอียดค่าใช้จ่ายก่อนสั่งพิมพ์
            </div>
          </div>
        </div>

        <div className="mt-4 sm:ml-14 sm:mt-5 flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-100 dark:border-emerald-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-emerald-700 dark:text-emerald-300 font-bold">ยอดรวมสุทธิ</span>
              <span className="text-xs text-gray-500">#{invoiceNumber}</span>
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              ฿{netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-xs text-emerald-600/80 dark:text-emerald-400/80">
              ลูกค้า: {customerName} | สัตว์เลี้ยง: {petNames}
            </div>
          </div>

          <div className="space-y-2">
             <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-sm"
            >
              <Printer size={18} />
              สั่งพิมพ์ใบเสร็จ (Print Invoice)
            </button>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              กรุณาเลือกขนาดกระดาษให้ตรงกับเครื่องพิมพ์ของคุณก่อนสั่งพิมพ์
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 shrink-0">
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
