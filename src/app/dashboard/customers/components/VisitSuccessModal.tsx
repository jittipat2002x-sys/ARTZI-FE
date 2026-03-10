'use client';

import React from 'react';
import { useBranding } from '@/contexts/branding-context';
import { CheckCircle2, Printer, Receipt, Calendar, X } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { Modal } from '@/components/ui/modal';

interface VisitSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitData: any;
  customerName: string;
  onPrintLabels: () => void;
  onPrintInvoice: () => void;
  onPrintAppointment: () => void;
}

export function VisitSuccessModal({
  isOpen,
  onClose,
  visitData,
  customerName,
  onPrintLabels,
  onPrintInvoice,
  onPrintAppointment
}: VisitSuccessModalProps) {
  const { brandColor } = useBranding();

  if (!isOpen || !visitData) return null;

  // Robustly handle cases where visitData might be nested or have different naming
  const actualData = visitData.data || visitData;
  const appointments = actualData.appointments || [];
  const medicalRecords = actualData.medicalRecords || actualData.medical_records || [];
  const hasInvoice = !!(actualData.invoice || actualData.invoiceId);
  const hasLabels = medicalRecords.some((r: any) => (r.medications?.length > 0 || r.treatments?.length > 0)) || false;

  // Consolidate appointments from both relation and medical records (for robustness)
  const appointmentsData: any[] = [];
  const seenPetIds = new Set();

  // 1. Check direct appointments relation (Preferred)
  appointments.forEach((a: any) => {
    if (!seenPetIds.has(a.petId)) {
      appointmentsData.push({
        petId: a.petId,
        petName: a.pet?.name || 'สัตว์เลี้ยง',
        date: a.date
      });
      seenPetIds.add(a.petId);
    }
  });

  // 2. Fallback to medical records if no appointments found in relation
  if (appointmentsData.length === 0) {
    medicalRecords.forEach((r: any) => {
      const apptDate = r.nextAppointmentDate || r.next_appointment_date;
      if (apptDate && !seenPetIds.has(r.petId)) {
        appointmentsData.push({
          petId: r.petId,
          petName: r.pet?.name || 'สัตว์เลี้ยง',
          date: apptDate
        });
        seenPetIds.add(r.petId);
      }
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="sm:max-w-lg" wrapperClassName="!z-[100]">
      <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 sm:mx-0 sm:h-10 sm:w-10">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-2" id="modal-title">
              บันทึกสำเร็จ!
            </h3>
            <div className="mt-2 mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ทำการบันทึกข้อมูลการเข้ารักษาของ {customerName} เรียบร้อยแล้ว
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3 mt-4">
              {hasLabels && (
                <button
                  onClick={onPrintLabels}
                  className="flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500 text-white shadow-sm">
                      <Printer size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-blue-900 dark:text-blue-100">พิมพ์ฉลากยา</div>
                      <div className="text-[10px] text-blue-600/70">สำหรับสัตว์เลี้ยงในรอบนี้</div>
                    </div>
                  </div>
                  <div className="text-blue-400 group-hover:translate-x-1 transition-transform">→</div>
                </button>
              )}

              {hasInvoice && (
                <button
                  onClick={onPrintInvoice}
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500 text-white shadow-sm">
                      <Receipt size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100">พิมพ์ใบเสร็จรับเงิน</div>
                      <div className="text-[10px] text-emerald-600/70">สรุปค่าใช้จ่ายทั้งหมด</div>
                    </div>
                  </div>
                  <div className="text-emerald-400 group-hover:translate-x-1 transition-transform">→</div>
                </button>
              )}

              {appointmentsData.length > 0 && (
                <button
                  onClick={onPrintAppointment}
                  className="flex items-center justify-between p-3 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border border-orange-100 dark:border-orange-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500 text-white shadow-sm">
                      <Calendar size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-orange-900 dark:text-orange-100">พิมพ์ใบนัดหมายรวม</div>
                      <div className="text-[10px] text-orange-600/70">ใบนัดสำหรับสัตว์เลี้ยงทุกตัวในรอบนี้</div>
                    </div>
                  </div>
                  <div className="text-orange-400 group-hover:translate-x-1 transition-transform">→</div>
                </button>
              )}
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
          เสร็จสิ้น (Finish)
        </button>
      </div>
    </Modal>
  );
}
