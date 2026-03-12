'use client';

import React from 'react';
import { useBranding } from '@/contexts/branding-context';
import { X, Calendar, Printer } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { Modal } from '@/components/ui/modal';

interface Appointment {
  petName: string;
  date: string;
  reason: string;
  vetName?: string;
}

interface PrintAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  appointments: Appointment[];
}

export function PrintAppointmentModal({
  isOpen,
  onClose,
  customerName,
  appointments
}: PrintAppointmentModalProps) {
  const { brandColor, logoUrl, branchName, tenantName } = useBranding();
  const [selectedSize, setSelectedSize] = React.useState('90x54mm');

  const paperSizes = [
    { id: '90x54mm', label: '90 x 54 mm (Card)', width: '90mm' },
    { id: '80mm', label: '80mm (Thermal)', width: '80mm' },
    { id: 'A6', label: 'A6 (Standard)', width: '105mm' },
  ];

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

    const appointmentsHtml = appointments.map((appt, idx) => `
      <div class="appointment-block" style="${idx > 0 ? 'margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 20px;' : ''}">
        <div class="info-block">
          <div class="label">Patient / ชื่อสัตว์เลี้ยง</div>
          <div class="value">${appt.petName}</div>
        </div>

        <div class="appointment-time">
          <div class="label" style="color: ${brandColor}">Appointment Date / วันที่นัดหมาย</div>
          <div class="time-value">${appt.date}</div>
        </div>

        <div class="info-block">
          <div class="label">Reason / สาเหตุที่นัด</div>
          <div class="value">${appt.reason}</div>
        </div>

        ${appt.vetName ? `
        <div class="info-block">
          <div class="label">With / นัดกับ</div>
          <div class="value">${appt.vetName}</div>
        </div>
        ` : ''}
      </div>
    `).join('');

    doc.open();
    // Dynamic styles based on paper size
    let pageCss = '';
    let bodyPadding = '15px';
    let cardBorder = `2px dashed ${brandColor}`;
    let fontSizeScale = 1;
    let cardPadding = '20px';
    let cardRadius = '15px';
    let cardHeight = 'auto';
    let cardWidth = '100%';

    if (selectedSize === '90x54mm') {
      pageCss = `@page { size: 90mm 54mm; margin: 0; }`;
      bodyPadding = '0';
      fontSizeScale = 0.75;
      cardPadding = '10px';
      cardBorder = 'none';
      cardRadius = '0';
      cardHeight = '54mm';
      cardWidth = '90mm';
    } else if (selectedSize === '80mm') {
      pageCss = `@page { size: 80mm auto; margin: 0; }`;
      bodyPadding = '5px';
      fontSizeScale = 0.85;
      cardPadding = '15px';
      cardBorder = `1px solid ${brandColor}30`;
      cardWidth = '100%';
    } else { // A6
      pageCss = `@page { size: A6; margin: 0; }`;
      bodyPadding = '10mm';
      fontSizeScale = 1;
      cardPadding = '20px';
      cardWidth = '100%';
    }

    doc.write(`
      <html>
        <head>
          <title>Appointments - ${customerName}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700;800&display=swap" rel="stylesheet">
          <style>
            ${pageCss}
            body { 
              font-family: 'Sarabun', sans-serif; 
              margin: 0; 
              padding: ${bodyPadding}; 
              color: #333; 
              text-align: center;
              font-size: ${14 * fontSizeScale}px;
            }
            .card { 
              border: ${cardBorder}; 
              padding: ${cardPadding}; 
              border-radius: ${cardRadius}; 
              width: ${cardWidth};
              height: ${cardHeight};
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .header { margin-bottom: ${10 * fontSizeScale}px; text-align: center; }
            .logo { height: ${40 * fontSizeScale}px; margin-bottom: ${5 * fontSizeScale}px; display: block; margin-left: auto; margin-right: auto; }
            .title { font-size: ${18 * fontSizeScale}px; font-weight: bold; color: ${brandColor}; margin-bottom: ${2 * fontSizeScale}px; }
            .subtitle { font-size: ${12 * fontSizeScale}px; color: #666; margin-bottom: ${2 * fontSizeScale}px; }
            .divider { border-bottom: 2px solid #eee; margin-bottom: ${8 * fontSizeScale}px; padding-bottom: ${4 * fontSizeScale}px; }
            .info-block { margin-bottom: ${5 * fontSizeScale}px; text-align: left; }
            .label { font-size: ${9 * fontSizeScale}px; color: #888; text-transform: uppercase; font-weight: bold; }
            .value { font-size: ${15 * fontSizeScale}px; font-weight: bold; margin-top: 0px; }
            .appointment-time { background: ${brandColor}10; padding: ${6 * fontSizeScale}px; border-radius: 6px; margin: ${8 * fontSizeScale}px 0; border: 1px solid ${brandColor}30; }
            .time-value { font-size: ${17 * fontSizeScale}px; color: ${brandColor}; font-weight: 900; }
            .footer { margin-top: ${10 * fontSizeScale}px; font-size: ${10 * fontSizeScale}px; color: #888; }
            .appointment-block { text-align: left; }
            @media print {
              body { padding: ${bodyPadding}; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : `<div style="font-size: ${20 * fontSizeScale}px; font-weight: bold; color: ${brandColor}">${branchName || tenantName || 'Clinic'}</div>`}
              <div class="title">ใบนัดหมาย</div>
              <div class="subtitle">Appointment Slip</div>
              <div class="divider"></div>
            </div>

            <div class="info-block" style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
              <div class="label">Owner / เจ้าของ</div>
              <div class="value">${customerName}</div>
            </div>

            ${appointmentsHtml}

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
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10" style={{ backgroundColor: `${brandColor}20` }}>
            <Calendar className="h-6 w-6" style={{ color: brandColor }} aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-2" id="modal-title">
              พิมพ์ใบนัดหมายรวม
            </h3>
            
            <div className="mt-4 mb-4">
              <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase tracking-wider">ขนาดกระดาษ (Paper Size)</label>
              <div className="grid grid-cols-3 gap-2">
                {paperSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    className="py-2 px-1 text-[10px] font-bold rounded-md border transition-all"
                    style={{
                      backgroundColor: selectedSize === size.id ? `${brandColor}10` : 'transparent',
                      borderColor: selectedSize === size.id ? brandColor : undefined,
                      color: selectedSize === size.id ? brandColor : undefined,
                      boxShadow: selectedSize === size.id ? `0 0 0 2px ${brandColor}10` : undefined
                    }}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              ตรวจสอบวันและเวลานัดหมายของสัตว์เลี้ยงแต่ละตัวก่อนสั่งพิมพ์
            </div>

            <div className="mt-4 space-y-3">
              {appointments.map((appt, idx) => (
                <div key={idx} className="p-3 border rounded-md" style={{ backgroundColor: `${brandColor}10`, borderColor: `${brandColor}20` }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{appt.petName}</div>
                      <div className="text-xs font-semibold" style={{ color: brandColor }}>{appt.date}</div>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase italic">เหตุผล: {appt.reason}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2">
               <BrandButton
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-md font-semibold transition-colors shadow-sm"
              >
                <Printer size={18} />
                สั่งพิมพ์ใบนัด (Print Slip)
              </BrandButton>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                กรุณาเลือกขนาดกระดาษให้ตรงกับเครื่องพิมพ์ของคุณก่อนสั่งพิมพ์
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
