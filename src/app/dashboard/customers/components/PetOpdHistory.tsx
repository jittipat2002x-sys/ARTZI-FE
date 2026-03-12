import React, { useState } from 'react';
import { useGetPetHistory, useUpdateMedication } from '../hooks/useVisits';
import { useBranding } from '@/contexts/branding-context';
import { History, ClipboardList, Stethoscope, Pill, Printer, Edit2, Check, X, PencilLine, Box } from 'lucide-react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { MedicationUsageModal } from './MedicationUsageModal';
import { PrintLabelModal } from './PrintLabelModal';
import { PrintInvoiceModal } from './PrintInvoiceModal';
import { PrintAppointmentModal } from './PrintAppointmentModal';
import { Receipt, Calendar as CalendarIcon, FlaskConical, FileDown } from 'lucide-react';
import { PetConsentHistory } from '../../medical/components/PetConsentHistory';

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
                    <ClipboardList size={10} /> การวินิจฉัย/Diagnosis:
                  </span>
                  <p className="text-gray-700 dark:text-gray-300">{record.diagnosis || '-'}</p>
                </div>
              </div>

              {record.treatment && (
                <div className="mt-2 text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                    <History size={10} /> แผนการรักษา/Treatment:
                  </span>
                  <p>{record.treatment}</p>
                </div>
              )}
              
              {record.notes && (
                <div 
                  className="mt-2 text-gray-700 dark:text-gray-300 italic border-l-2 pl-2 py-0.5 rounded-r shadow-sm" 
                  style={{ 
                    borderLeftColor: brandColor,
                    backgroundColor: brandColor + '08'
                  }}
                >
                  <span className="text-gray-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1 (not-italic)">
                    <PencilLine size={10} style={{ color: brandColor }} /> อธิบายเพิ่มเติม/Additional Notes:
                  </span>
                  <p className="text-sm">{record.notes}</p>
                </div>
              )}

              {record.admission && (
                <div 
                  className="mt-2 p-2 rounded border flex items-center gap-2"
                  style={{ 
                    backgroundColor: brandColor + '08', 
                    borderColor: brandColor + '20' 
                  }}
                >
                  <Box size={14} style={{ color: brandColor }} />
                  <div className="text-xs">
                    <span className="font-semibold" style={{ color: brandColor }}>แอดมิท (IPD):</span>
                    <span className="ml-1 font-medium" style={{ color: brandColor }}>
                      {record.admission.cage?.ward?.name || 'ไม่ระบุห้อง'} - {record.admission.cage?.name || 'ไม่ระบุกรง'}
                    </span>
                    {(record.admission.reason || record.admission.notes) && (
                      <div className="mt-1 text-[10px] italic opacity-70" style={{ color: brandColor }}>
                        {record.admission.reason && `สาเหตุ: ${record.admission.reason}`}
                        {record.admission.notes && ` (หมายเหตุ: ${record.admission.notes})`}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {record.labTests && record.labTests.length > 0 && (
                <div className="mt-2 space-y-2">
                  <span className="text-gray-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                    <FlaskConical size={10} /> ผลตรวจทางห้องปฏิบัติการ (Lab Results):
                  </span>
                  {record.labTests.map((lab: any, lIdx: number) => (
                    <div 
                      key={lIdx} 
                      className="mt-2 text-gray-700 dark:text-gray-300 border-l-2 pl-3 py-2 rounded-r shadow-sm"
                      style={{ 
                        borderLeftColor: brandColor,
                        backgroundColor: brandColor + '08' 
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-semibold">{lab.testType}</p>
                          <p className="text-sm font-medium" style={{ color: brandColor }}>ผล: {lab.result || '-'}</p>
                        </div>
                      </div>
                      {lab.notes && <p className="text-xs text-gray-500 mt-1 italic">{lab.notes}</p>}
                      
                      {lab.files && lab.files.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {lab.files.map((file: any, fIdx: number) => (
                            <a 
                              key={fIdx}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 hover:bg-brand/10 hover:text-brand rounded text-[10px] transition-colors border border-gray-200 dark:border-gray-600 no-print"
                              style={{ color: brandColor }}
                              download={file.name}
                            >
                              <FileDown size={10} />
                              <span className="max-w-[100px] truncate">{file.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {record.medications && record.medications.length > 0 && (
                <div 
                  className="mt-3 text-gray-700 dark:text-gray-300 border-l-2 pl-3 py-2 rounded-r shadow-sm"
                  style={{ 
                    borderLeftColor: brandColor,
                    backgroundColor: brandColor + '08' 
                  }}
                >
                  <span className="text-gray-500 text-xs font-semibold mb-2 flex items-center gap-1">
                    <Pill size={12} /> รายละเอียดค่าใช้จ่าย (ยาและบริการ):
                  </span>
                  <ul className="space-y-2 text-xs">
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
                        <li key={med.id} className="group flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-wrap gap-1.5">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap shadow-sm">
                                {typeLabel}
                              </span>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">{inv?.name}</span>
                              <span className="text-gray-500 text-[10px] bg-gray-100 dark:bg-gray-700 px-1 rounded">x {med.quantity}</span>
                            </div>
                            
                            <button 
                                onClick={() => {
                                  setEditingMedId(med.id);
                                  setActiveInvName(inv?.name || '');
                                  setIsUsageModalOpen(true);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-brand hover:bg-brand/10 transition-all rounded no-print shrink-0"
                                style={{ color: brandColor }}
                                title="แก้ไขวิธีใช้"
                              >
                                <Edit2 size={12} />
                              </button>
                          </div>
                          
                          {/* Dosage override or default */}
                          <div className="pl-[4.5rem] mt-0.5 text-gray-500 dark:text-gray-400 text-[11px] italic">
                            {dosageOverrides[med.id] || med.dosage ? (
                              <span>วิธีใช้: {dosageOverrides[med.id] || med.dosage}</span>
                            ) : (
                              <span className="opacity-60">ไม่มีข้อกำหนดวิธีใช้</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ))}

          <PetConsentHistory petId={petId} />
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
          customerName={(activeRecord.customer?.firstName || activeRecord.visit?.customer?.firstName || activeRecord.pet?.customer?.firstName || 'Unknown') + ' ' + (activeRecord.customer?.lastName || activeRecord.visit?.customer?.lastName || activeRecord.pet?.customer?.lastName || '')}
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
          customerName={(activeRecord.visit?.customer?.firstName || activeRecord.customer?.firstName || activeRecord.pet?.customer?.firstName || 'Unknown') + ' ' + (activeRecord.visit?.customer?.lastName || activeRecord.customer?.lastName || activeRecord.pet?.customer?.lastName || '')}
          petNames={activeRecord.pet?.name || ''}
          invoiceDate={new Date(activeRecord.visit.invoice.createdAt).toLocaleDateString('th-TH')}
          invoiceNumber={activeRecord.visit.invoice.id.slice(0, 8).toUpperCase()}
          items={activeRecord.visit.invoice.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            medicalRecordId: item.medicalRecordId,
            id: item.id
          }))}
          totalAmount={activeRecord.visit.invoice.totalAmount}
          discount={activeRecord.visit.invoice.discount}
          netAmount={activeRecord.visit.invoice.netAmount}
          paymentMethod={activeRecord.visit.invoice.paymentMethod}
          medicalRecords={activeRecord.visit.medicalRecords}
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
          customerName={(activeRecord.visit?.customer?.firstName || activeRecord.customer?.firstName || activeRecord.pet?.customer?.firstName || 'Unknown') + ' ' + (activeRecord.visit?.customer?.lastName || activeRecord.customer?.lastName || activeRecord.pet?.customer?.lastName || '')}
          appointments={[{
            petName: activeRecord.pet?.name || 'Unknown',
            date: new Date(selectedAppt.date).toLocaleString('th-TH', { 
              year: 'numeric', month: 'long', day: 'numeric', 
              hour: '2-digit', minute: '2-digit' 
            }),
            reason: selectedAppt.reason,
            vetName: activeRecord.vet?.firstName
          }]}
        />
      )}
    </div>
  );
}
