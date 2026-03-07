'use client';

import React from 'react';
import { useBranding } from '@/contexts/branding-context';
import { X, Receipt, Printer } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { Modal } from '@/components/ui/modal';

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
  paymentMethod
}: PrintInvoiceModalProps) {
  const { brandColor, logoUrl } = useBranding();

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

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice.toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.totalPrice.toLocaleString()}</td>
      </tr>
    `).join('');

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Invoice - ${invoiceNumber}</title>
          <style>
            @page { margin: 10mm; }
            body { font-family: 'Inter', 'Sarabun', sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid ${brandColor}; padding-bottom: 15px; }
            .logo { height: 60px; }
            .company-info { text-align: right; }
            .invoice-title { font-size: 24px; font-weight: bold; color: ${brandColor}; margin-bottom: 20px; text-transform: uppercase; }
            .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .detail-group { flex: 1; }
            .label { font-size: 10px; color: #888; text-transform: uppercase; font-weight: bold; }
            .value { font-size: 14px; font-weight: bold; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f9f9f9; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #eee; }
            .totals { margin-left: auto; width: 250px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
            .grand-total { border-top: 2px solid ${brandColor}; margin-top: 10px; padding-top: 10px; font-size: 18px; font-weight: bold; color: ${brandColor}; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : `<div style="font-size: 24px; font-weight: bold; color: ${brandColor}">Clinic</div>`}
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
              ${itemsHtml}
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

          <div style="margin-top: 30px; font-size: 14px;">
            <strong>Payment Method:</strong> ${paymentMethod || 'Cash'}
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
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="sm:max-w-2xl flex flex-col max-h-[90vh]" wrapperClassName="!z-[130]">
      <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4 flex-1 flex flex-col min-h-0">
        <div className="sm:flex sm:items-start shrink-0">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 sm:mx-0 sm:h-10 sm:w-10">
            <Receipt className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-2" id="modal-title">
              พิมพ์ใบเสร็จรับเงิน
            </h3>
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
              ใบเสร็จจะถูกจัดรูปแบบสำหรับกระดาษ A4 หรือ A5 โดยอัตโนมัติ
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
