import React, { useState } from 'react';
import { useGetPetHistory, useUpdateMedication } from '../hooks/useVisits';
import { useBranding } from '@/contexts/branding-context';
import { History, ClipboardList, Stethoscope, Pill, Printer, Edit2, Check, X, PencilLine } from 'lucide-react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { MedicationUsageModal } from './MedicationUsageModal';
import { PrintLabelModal } from './PrintLabelModal';
import { PrintInvoiceModal } from './PrintInvoiceModal';
import { PrintAppointmentModal } from './PrintAppointmentModal';
import { Receipt, Calendar as CalendarIcon } from 'lucide-react';

interface PetOpdHistoryProps {
  petId: string;
}

export function PetOpdHistory({ petId }: PetOpdHistoryProps) {
  const { data: history, isLoading } = useGetPetHistory(petId);
  const updateMedication = useUpdateMedication();
  const { brandColor } = useBranding();
  const [isOpen, setIsOpen] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [dosageOverrides, setDosageOverrides] = useState<Record<string, string>>({});
  const [activeInvName, setActiveInvName] = useState('');
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingItems, setPrintingItems] = useState<any[]>([]);
  const [activeRecord, setActiveRecord] = useState<any>(null);

  // Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  
  // Appointment Modal State
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

  if (isLoading) {
    return <div className="text-sm text-gray-500 my-2 animate-pulse">กำลังโหลดประวัติ...</div>;
  }

  const records = (history as any)?.data || history;

  if (!records || records.length === 0) {
    return (
      <div className="mb-4 p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-center bg-gray-50/50 dark:bg-gray-800/30">
        <p className="text-xs text-gray-400 italic">ไม่มีประวัติการรักษาก่อนหน้านี้</p>
      </div>
    );
  }

  return (
    <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2" style={{ color: brandColor }}>
          <Clock size={16} />
          <span className="text-sm font-semibold">ประวัติการรักษา (OPD History) - {records.length} ครั้ง</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>

      {isOpen && (
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto space-y-4 printable-area">
          <style jsx global>{`
            @media print {
              body * { visibility: hidden; }
              .printable-labels, .printable-labels * { visibility: visible; }
              .printable-labels { position: absolute; left: 0; top: 0; width: 100%; }
              .no-print { display: none !important; }
            }
          `}</style>
          {records.map((record: any) => (
            <div key={record.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <History size={14} className="text-gray-400" />
                  วันที่: {new Date(record.createdAt).toLocaleDateString('th-TH')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">น.สพ. {record.vet?.firstName}</span>
                  {record.medications?.length > 0 && (
                    <button 
                      onClick={() => {
                        const itemsToPrint = record.medications.map((med: any) => ({
                          name: med.inventory?.name,
                          quantity: med.quantity,
                          usageInstructions: dosageOverrides[med.id] || med.dosage || med.usageInstructions || ''
                        }));
                        setPrintingItems(itemsToPrint);
                        setActiveRecord(record);
                        setIsPrintModalOpen(true);
                      }}
                      className="p-1 hover:bg-gray-200 rounded text-blue-600 no-print"
                      title="พิมพ์ฉลากยา"
                    >
                      <Printer size={14} />
                    </button>
                  )}
                  
                  {/* Print Invoice Button */}
                  {record.visit?.invoice && (
                    <button 
                      onClick={() => {
                        setActiveRecord(record);
                        setIsInvoiceModalOpen(true);
                      }}
                      className="p-1 hover:bg-gray-200 rounded text-emerald-600 no-print"
                      title="พิมพ์ใบเสร็จ"
                    >
                      <Receipt size={14} />
                    </button>
                  )}

                  {/* Print Appointment Button */}
                  {record.pet?.appointments?.some((appt: any) => new Date(appt.createdAt).toDateString() === new Date(record.createdAt).toDateString()) && (
                    <button 
                      onClick={() => {
                        const appt = record.pet.appointments.find((a: any) => new Date(a.createdAt).toDateString() === new Date(record.createdAt).toDateString());
                        setSelectedAppt(appt);
                        setActiveRecord(record);
                        setIsApptModalOpen(true);
                      }}
                      className="p-1 hover:bg-gray-200 rounded text-orange-600 no-print"
                      title="พิมพ์ใบนัดหมาย"
                    >
                      <CalendarIcon size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <span className="text-gray-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                    <Stethoscope size={10} /> อาการ/Physical Exam:
                  </span>
                  <p className="text-gray-700 dark:text-gray-300">{record.symptoms || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                    <ClipboardList size={10} /> แผนการรักษา/Diagnosis:
                  </span>
                  <p className="text-gray-700 dark:text-gray-300">{record.diagnosis || '-'}</p>
                </div>
              </div>

              {record.treatment && (
                <div className="mt-2">
                  <span className="text-gray-500 text-xs block">แผนการรักษา/Treatment:</span>
                  <p className="text-gray-700 dark:text-gray-300">{record.treatment}</p>
                </div>
              )}

              {record.medications && record.medications.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-gray-500 text-xs font-semibold mb-1 flex items-center gap-1">
                    <Pill size={12} /> รายการยาและบริการ:
                  </span>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-xs">
                    {record.medications.map((med: any) => {
                      // Determine the display type based on the fetched inventory relation
                      const inv = med.inventory;
                      let typeLabel = inv?.type === 'MEDICINE' ? 'ยา' 
                                    : inv?.type === 'VACCINE' ? 'วัคซีน' 
                                    : inv?.type === 'SERVICE' ? 'บริการ' 
                                    : inv?.type || 'อื่นๆ';
                                    
                      if (inv?.type === 'MEDICINE' && inv?.masterMedicineCategory?.nameTh) {
                        typeLabel += ` (${inv.masterMedicineCategory.nameTh})`;
                      }

                      return (
                        <li key={med.id} className="mb-2 group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-wrap gap-1">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[10px] text-gray-600 dark:text-gray-300 mr-1 font-medium">
                                {typeLabel}
                              </span>
                              <span className="font-medium">{inv?.name} x {med.quantity}</span>
                              {dosageOverrides[med.id] || med.dosage ? (
                                <span className="text-gray-600 dark:text-gray-400 italic">
                                  {` (${dosageOverrides[med.id] || med.dosage})`}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic"> (ไม่มีวิธีใช้)</span>
                              )}
                            </div>
                            
                            <button 
                                onClick={() => {
                                  setEditingMedId(med.id);
                                  setActiveInvName(inv?.name || '');
                                  setIsUsageModalOpen(true);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-opacity no-print"
                                title="แก้ไขวิธีใช้"
                              >
                                <Edit2 size={12} />
                              </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <MedicationUsageModal 
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
        inventoryName={activeInvName}
        onSave={(instruction: string) => {
          if (editingMedId) {
            setDosageOverrides(prev => ({ ...prev, [editingMedId]: instruction }));
            setEditingMedId(null);
          }
        }}
        initialValue={editingMedId ? (dosageOverrides[editingMedId] || records.flatMap((r: any) => r.medications || []).find((m: any) => m.id === editingMedId)?.dosage || '') : ''}
      />

      {isPrintModalOpen && activeRecord && (
        <PrintLabelModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setActiveRecord(null);
            setPrintingItems([]);
          }}
          petName={activeRecord.pet?.name || ''}
          customerName={activeRecord.customer?.firstName + ' ' + (activeRecord.customer?.lastName || '')}
          items={printingItems}
        />
      )}

      {isInvoiceModalOpen && activeRecord?.visit?.invoice && (
        <PrintInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setActiveRecord(null);
          }}
          customerName={activeRecord.visit.customer?.firstName + ' ' + (activeRecord.visit.customer?.lastName || '')}
          petNames={activeRecord.pet?.name || ''}
          invoiceDate={new Date(activeRecord.visit.invoice.createdAt).toLocaleDateString('th-TH')}
          invoiceNumber={activeRecord.visit.invoice.id.slice(0, 8).toUpperCase()}
          items={activeRecord.visit.invoice.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }))}
          totalAmount={activeRecord.visit.invoice.totalAmount}
          discount={activeRecord.visit.invoice.discount}
          netAmount={activeRecord.visit.invoice.netAmount}
          paymentMethod={activeRecord.visit.invoice.paymentMethod}
        />
      )}

      {isApptModalOpen && activeRecord && selectedAppt && (
        <PrintAppointmentModal
          isOpen={isApptModalOpen}
          onClose={() => {
            setIsApptModalOpen(false);
            setSelectedAppt(null);
            setActiveRecord(null);
          }}
          customerName={activeRecord.visit?.customer?.firstName + ' ' + (activeRecord.visit?.customer?.lastName || '')}
          petName={activeRecord.pet?.name || ''}
          appointmentDate={new Date(selectedAppt.date).toLocaleString('th-TH', { 
            year: 'numeric', month: 'long', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
          })}
          reason={selectedAppt.reason}
          vetName={activeRecord.vet?.firstName}
        />
      )}
    </div>
  );
}
