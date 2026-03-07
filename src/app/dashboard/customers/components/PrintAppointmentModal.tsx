'use client';

import React from 'react';
import { useBranding } from '@/contexts/branding-context';
import { X, Calendar, Printer } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { Modal } from '@/components/ui/modal';

interface PrintAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  petName: string;
  appointmentDate: string;
  reason: string;
  vetName?: string;
}

export function PrintAppointmentModal({
  isOpen,
  onClose,
  customerName,
  petName,
  appointmentDate,
  reason,
  vetName
}: PrintAppointmentModalProps) {
  const { brandColor, logoUrl } = useBranding();

  if (!isOpen) return null;

  const handlePrint = () => {
    let iframe = document.getElementById('print-appt-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-appt-iframe';
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

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Appointment - ${petName}</title>
          <style>
            @page { size: 100mm 150mm; margin: 5mm; }
            body { font-family: 'Inter', 'Sarabun', sans-serif; margin: 0; padding: 15px; color: #333; text-align: center; }
            .card { border: 2px dashed ${brandColor}; padding: 20px; border-radius: 15px; }
            .header { margin-bottom: 20px; }
            .logo { height: 50px; margin-bottom: 10px; }
            .title { font-size: 20px; font-weight: bold; color: ${brandColor}; margin-bottom: 5px; }
            .subtitle { font-size: 14px; color: #666; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .info-block { margin-bottom: 15px; text-align: left; }
            .label { font-size: 10px; color: #888; text-transform: uppercase; font-weight: bold; }
            .value { font-size: 16px; font-weight: bold; margin-top: 2px; }
            .appointment-time { background: ${brandColor}10; padding: 15px; border-radius: 10px; margin: 20px 0; border: 1px solid ${brandColor}30; }
            .time-value { font-size: 20px; color: ${brandColor}; font-weight: 900; }
            .footer { margin-top: 30px; font-size: 11px; color: #888; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : `<div style="font-size: 20px; font-weight: bold; color: ${brandColor}">Clinic</div>`}
              <div class="title">ใบนัดหมาย</div>
              <div class="subtitle">Appointment Slip</div>
            </div>

            <div class="info-block">
              <div class="label">Patient / ชื่อสัตว์เลี้ยง</div>
              <div class="value">${petName}</div>
            </div>

            <div class="info-block">
              <div class="label">Owner / เจ้าของ</div>
              <div class="value">${customerName}</div>
            </div>

            <div class="appointment-time">
              <div class="label" style="color: ${brandColor}">Appointment Date / วันที่นัดหมาย</div>
              <div class="time-value">${appointmentDate}</div>
            </div>

            <div class="info-block">
              <div class="label">Reason / สาเหตุที่นัด</div>
              <div class="value">${reason}</div>
            </div>

            ${vetName ? `
            <div class="info-block">
              <div class="label">With / นัดกับ</div>
              <div class="value">${vetName}</div>
            </div>
            ` : ''}

            <div class="footer">
              Please arrive 10 minutes early.<br>
              กรุณามาก่อนเวลานัด 10 นาที
            </div>
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
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="sm:max-w-md" wrapperClassName="!z-[130]">
      <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 sm:mx-0 sm:h-10 sm:w-10">
            <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-2" id="modal-title">
              พิมพ์ใบนัดหมาย
            </h3>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              ตรวจสอบวันและเวลานัดหมายก่อนสั่งพิมพ์
            </div>

            <div className="mt-4 p-4 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 rounded-md">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="text-[10px] text-orange-700 dark:text-orange-300 font-bold uppercase tracking-wider">ใบนัดหมายครั้งถัดไป</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {petName}
                </div>
                <div className="text-md font-bold text-orange-700 dark:text-orange-400">
                  {appointmentDate}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  เหตุผล: {reason}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
               <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-md bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-colors shadow-sm"
              >
                <Printer size={18} />
                สั่งพิมพ์ใบนัด (Print Slip)
              </button>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                ใบนัดจะถูกจัดรูปแบบสำหรับเครื่องพิมพ์สลิปความร้อน หรือกระดาษขนาดเล็ก
              </p>
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
