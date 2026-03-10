import React, { useState } from 'react';
import { Customer } from '@/services/customer.service';
import { useBranding } from '@/contexts/branding-context';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandInput } from '@/components/ui/brand-input';
import { useCreateVisit } from '../hooks/useVisits';
import { authService } from '@/services/auth.service';
import { PetOpdHistory } from './PetOpdHistory';
import { PetMedicineSelector, SelectedMedication } from './PetMedicineSelector';
import { ThaiDateInput } from '@/components/ui/thai-date-input';
import { BrandTextarea } from '@/components/ui/brand-textarea';
import { Dog, ShoppingCart, Calendar, CheckCircle2, Printer, Receipt, Box, Search, X, FlaskConical, FileUp, Trash2 } from 'lucide-react';
import { Modal, AlertModal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { VisitSuccessModal } from './VisitSuccessModal';
import { PrintLabelModal } from './PrintLabelModal';
import { PrintInvoiceModal } from './PrintInvoiceModal';
import { PrintAppointmentModal } from './PrintAppointmentModal';
import { appointmentService, Appointment } from '@/services/appointment.service';
import { visitService, Visit } from '@/services/visit.service';
import { ipdService, Ward, Cage } from '@/services/ipd.service';
import { CageGridSelector } from '@/components/ipd/CageGridSelector';

interface VisitPanelProps {
  customer: Customer;
  linkedAppointments?: Appointment[];
  onClose: () => void;
}

export function VisitPanel({ customer, linkedAppointments, onClose }: VisitPanelProps) {
  const { brandColor } = useBranding();
  const createVisitMutation = useCreateVisit();
  const user = authService.getUser();

  const branchId = user?.branches?.[0]?.branchId;
  const [wards, setWards] = React.useState<Ward[]>([]);
  
  React.useEffect(() => {
    if (branchId) {
      ipdService.getWards(branchId).then(setWards).catch(console.error);
    }
  }, [branchId]);
  
  const [selectedPets, setSelectedPets] = React.useState<string[]>(() => {
    if (linkedAppointments && linkedAppointments.length > 0) {
      return Array.from(new Set(linkedAppointments.map(a => a.petId)));
    }
    return [];
  });

  const [petRecords, setPetRecords] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    if (linkedAppointments && linkedAppointments.length > 0) {
      linkedAppointments.forEach(app => {
        if (!initial[app.petId]) {
          initial[app.petId] = {
            petId: app.petId,
            vetId: app.vetId || user?.id || '',
            weightAtVisit: 0,
            temperature: 0,
            symptoms: app.reason || '',
            diagnosis: '',
            treatment: '',
            notes: '',
            medications: [],
            nextAppointmentDate: '',
            nextAppointmentTime: '09:00',
            nextAppointmentReason: '',
            appointmentIds: [app.id],
            ipdCageId: '',
            ipdNotes: '',
            labTests: []
          };
        } else {
          // If multiple appointments for the same pet in the linked group
          if (!initial[app.petId].appointmentIds.includes(app.id)) {
            initial[app.petId].appointmentIds.push(app.id);
          }
          // Combine reasons if multiple
          if (app.reason && !initial[app.petId].symptoms.includes(app.reason)) {
            initial[app.petId].symptoms += (initial[app.petId].symptoms ? ', ' : '') + app.reason;
          }
        }
      });
    }
    return initial;
  });
  const [generalItems, setGeneralItems] = useState<SelectedMedication[]>([]);
  
  // Success & Print States
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [createdVisit, setCreatedVisit] = useState<any>(null);
  
  const [isLabelPrintOpen, setIsLabelPrintOpen] = useState(false);
  const [isInvoicePrintOpen, setIsInvoicePrintOpen] = useState(false);
  const [isApptPrintOpen, setIsApptPrintOpen] = useState(false);
  
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info',
  });
  
  const [cageSelectorPetId, setCageSelectorPetId] = useState<string | null>(null);
  
  // Calculate total
  const petMedsTotal = Object.values(petRecords).reduce((acc, record) => {
    const meds = record.medications || [];
    return acc + meds.reduce((sum: number, med: SelectedMedication) => sum + (med.unitPrice * med.quantity), 0);
  }, 0);
  
  const generalTotal = generalItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const grandTotal = petMedsTotal + generalTotal;

  const handlePetToggle = (petId: string) => {
    if (selectedPets.includes(petId)) {
      setSelectedPets(prev => prev.filter(id => id !== petId));
      const newRecords = { ...petRecords };
      delete newRecords[petId];
      setPetRecords(newRecords);
    } else {
      setSelectedPets(prev => [...prev, petId]);
      
      // Try to restore appointmentIds if this pet was in the linked appointments
      const linkedForThisPet = linkedAppointments 
        ? linkedAppointments.filter(a => a.petId === petId).map(a => a.id)
        : [];
      const linkedSymptoms = linkedAppointments
        ? Array.from(new Set(linkedAppointments.filter(a => a.petId === petId).map(a => a.reason))).filter(Boolean).join(', ')
        : '';

      setPetRecords(prev => ({
        ...prev,
        [petId]: {
          petId,
          vetId: user?.id || '',
          weightAtVisit: 0,
          temperature: 0,
          symptoms: linkedSymptoms,
          diagnosis: '',
          treatment: '',
          notes: '',
          medications: [],
          nextAppointmentDate: '',
          nextAppointmentTime: '09:00',
          nextAppointmentReason: '',
          appointmentIds: linkedForThisPet,
          ipdCageId: '',
          ipdNotes: '',
          labTests: [],
        }
      }));
    }
  };

  const updatePetRecord = (petId: string, field: string, value: any) => {
    setPetRecords(prev => ({
      ...prev,
      [petId]: {
        ...prev[petId],
        [field]: value
      }
    }));
  };

  const addLabTest = (petId: string) => {
    const currentTests = petRecords[petId]?.labTests || [];
    updatePetRecord(petId, 'labTests', [
      ...currentTests,
      { testType: '', result: '', notes: '', files: [] }
    ]);
  };

  const removeLabTest = (petId: string, index: number) => {
    const currentTests = [...(petRecords[petId]?.labTests || [])];
    currentTests.splice(index, 1);
    updatePetRecord(petId, 'labTests', currentTests);
  };

  const updateLabTest = (petId: string, index: number, field: string, value: any) => {
    const currentTests = [...(petRecords[petId]?.labTests || [])];
    currentTests[index] = { ...currentTests[index], [field]: value };
    updatePetRecord(petId, 'labTests', currentTests);
  };

  const handleFileChange = async (petId: string, testIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = [...(petRecords[petId]?.labTests[testIndex].files || [])];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const filePromise = new Promise<{ name: string; base64Data: string; contentType: string }>((resolve) => {
        reader.onload = (event) => {
          resolve({
            name: file.name,
            base64Data: event.target?.result as string,
            contentType: file.type
          });
        };
      });
      
      reader.readAsDataURL(file);
      const fileData = await filePromise;
      newFiles.push(fileData);
    }

    updateLabTest(petId, testIndex, 'files', newFiles);
  };

  const handleSubmit = () => {
    if (selectedPets.length === 0) {
      setAlertConfig({
        isOpen: true,
        title: 'คำแนะนำ',
        description: 'กรุณาเลือกสัตว์เลี้ยงอย่างน้อย 1 ตัว',
        type: 'warning'
      });
      return;
    }
    setIsConfirmSaveOpen(true);
  };

  const handleSaveVisit = async () => {
    try {
      if (!user?.id || !user?.branches?.[0]?.branchId) {
        setAlertConfig({
          isOpen: true,
          title: 'ข้อผิดพลาด',
          description: 'ไม่พบข้อมูลสาขา หรือ เซสชันหมดอายุ',
          type: 'danger'
        });
        return;
      }
      
      const currentUser = authService.getUser();
      const recordsToCreate = Object.values(petRecords).map(record => {
        let finalApptDate = record.nextAppointmentDate;
        if (finalApptDate && record.nextAppointmentTime) {
          // Parse YYYY-MM-DD safely even if it's an ISO string (split by T first)
          const datePart = finalApptDate.includes('T') ? finalApptDate.split('T')[0] : finalApptDate;
          const [year, month, day] = datePart.split('-').map(Number);
          const [h, m] = record.nextAppointmentTime.split(':').map(Number);
          const d = new Date(year, month - 1, day, h, m);
          finalApptDate = d.toISOString();
        }

        const { nextAppointmentTime: _, appointmentIds, ...rest } = record;
        const apptDateToSend = finalApptDate && finalApptDate.trim() !== '' ? finalApptDate : null;
        
        const ipdCageId = record.ipdCageId === 'PENDING' || record.ipdCageId === '' ? undefined : record.ipdCageId;
        
        return {
          ...rest,
          appointmentIds,
          nextAppointmentDate: apptDateToSend as any,
          ipdCageId,
          vetId: record.vetId === 'REPLACE_WITH_USER_ID' || !record.vetId ? (currentUser?.id || '') : record.vetId,
          medications: (record.medications || []).map((med: any) => ({
            inventoryId: med.inventoryId,
            inventoryName: med.inventoryName,
            quantity: med.quantity,
            unitPrice: med.unitPrice,
            usageInstructions: med.usageInstructions || ''
          }))
        };
      });
      
      const result = await createVisitMutation.mutateAsync({
        customerId: customer.id,
        branchId: currentUser?.branches?.[0]?.branchId || '',
        medicalRecords: recordsToCreate as any,
        generalItems: generalItems.map(item => ({
          productId: item.inventoryId,
          name: item.inventoryName,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        discount: 0,
      });
      
      // Robust extraction of the visit object from potential wrappers or arrays
      const resultObj = result as any;
      let visitData = null;

      // Prioritize direct data access
      const rawData = resultObj?.data || resultObj;

      if (Array.isArray(rawData)) {
        // If it's an array of medical records, look for the visit object inside the first record
        visitData = rawData[0]?.visit;
        
        // If visit relation is missing but we have medical records, 
        // we can try to "reconstruct" a minimal visit if we HAVE to, 
        // but it's better to log a specific error.
        if (!visitData && rawData[0]?.visitId) {
          console.warn('Backend returned records without visit relation. Attempting reconstruction.');
          visitData = { 
            id: rawData[0].visitId, 
            visitDate: rawData[0].visitDate || new Date().toISOString(),
            medicalRecords: rawData 
          };
        }
      } else {
        // Fallback to extraction from object
        visitData = rawData?.id ? rawData : rawData?.data;
      }
      
      if (!visitData || !visitData.id) {
        console.error('Visit data extraction failed. Result structure:', resultObj);
        throw new Error('บันทึกสำเร็จแต่ไม่ได้รับข้อมูลการเข้ารักษากลับมา (Missing Visit Data)');
      }

      setCreatedVisit(visitData);
      setIsSuccessOpen(true);
      // Don't call onClose() yet, wait for success modal
    } catch (error: any) {
      console.error('Failed to create visit:', error);
      setAlertConfig({
        isOpen: true,
        title: 'เกิดข้อผิดพลาด',
        description: error?.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        type: 'danger'
      });
    }
  };

  return (
    <>
      <div className="p-6 bg-white dark:bg-gray-800 rounded-b-xl border-t border-gray-100 dark:border-gray-700 shadow-inner">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: brandColor }}>
          สร้างรายการเข้ารักษาใหม่
        </h3>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">ปิด</button>
      </div>

      {/* Select Pets */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">เลือกสัตว์เลี้ยงที่เข้ารับการรักษา:</label>
        <div className="flex flex-wrap gap-3">
          {customer.pets?.map((pet: any) => (
            <button
              key={pet.id}
              onClick={() => handlePetToggle(pet.id!)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all border flex items-center gap-2"
              style={selectedPets.includes(pet.id!) ? {
                backgroundColor: brandColor + '15',
                borderColor: brandColor,
                color: brandColor
              } : {
                backgroundColor: 'transparent',
                borderColor: '#e5e7eb',
                color: '#6b7280'
              }}
            >
              <Dog size={16} /> {pet.name}
            </button>
          ))}
          {!customer.pets?.length && <p className="text-xs text-red-500">ไม่พบสัตว์เลี้ยงสำหรับลูกค้านี้</p>}
        </div>
      </div>

      {/* Pet Forms */}
      <div className="space-y-8">
        {selectedPets.map(petId => {
          const pet: any = customer.pets?.find((p: any) => p.id === petId);
          const record = petRecords[petId];
          return (
            <div key={petId} className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4 relative">
              <h4 className="font-bold text-gray-800 dark:text-gray-200" style={{ color: brandColor }}>{pet?.name} <span className="text-xs font-normal text-gray-500 ml-2">({pet?.species})</span></h4>
              
              <PetOpdHistory petId={petId} />

              <div className="grid grid-cols-2 gap-4">
                 <BrandInput 
                  label="น้ำหนัก (กก.)" 
                  type="number"
                  value={record.weightAtVisit}
                  onChange={e => updatePetRecord(petId, 'weightAtVisit', parseFloat(e.target.value))}
                 />
                 <BrandInput 
                  label="อุณหภูมิ (°C)" 
                  type="number"
                  value={record.temperature}
                  onChange={e => updatePetRecord(petId, 'temperature', parseFloat(e.target.value))}
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BrandTextarea
                  label="อาการเบื้องต้น (Symptoms)"
                  rows={2}
                  value={record.symptoms}
                  onChange={e => updatePetRecord(petId, 'symptoms', e.target.value)}
                />
                <BrandTextarea
                  label="ผลการวินิจฉัย (Diagnosis)"
                  rows={2}
                  value={record.diagnosis}
                  onChange={e => updatePetRecord(petId, 'diagnosis', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BrandTextarea
                  label="แผนการรักษา (Treatment Plan)"
                  rows={2}
                  value={record.treatment}
                  onChange={e => updatePetRecord(petId, 'treatment', e.target.value)}
                />
                <BrandTextarea
                  label="อธิบายเพิ่มเติม (Additional Notes)"
                  rows={2}
                  placeholder="เช่น พฤติกรรมสัตว์, ข้อควรระวังพิเศษ..."
                  value={record.notes}
                  onChange={e => updatePetRecord(petId, 'notes', e.target.value)}
                />
              </div>

              {/* Next Appointment Section */}
              <div 
                className="p-4 border rounded-xl space-y-3"
                style={{ 
                  backgroundColor: brandColor + '08',
                  borderColor: brandColor + '20' 
                }}
              >
                <h5 className="text-xs font-bold flex items-center gap-2" style={{ color: brandColor }}>
                  <Calendar size={14} /> นัดหมายครั้งถัดไป (Optional)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <ThaiDateInput 
                      label="วันที่นัดหมาย"
                      value={record.nextAppointmentDate}
                      onChange={value => updatePetRecord(petId, 'nextAppointmentDate', value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <BrandInput 
                      label="เวลา"
                      type="time"
                      value={record.nextAppointmentTime}
                      onChange={e => updatePetRecord(petId, 'nextAppointmentTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <BrandInput 
                      label="สาเหตุการนัด"
                      placeholder="เช่น นัดดูอาการ, ฉีดวัคซีนเข็ม 2"
                      value={record.nextAppointmentReason}
                      onChange={e => updatePetRecord(petId, 'nextAppointmentReason', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* IPD Admission Section */}
              <div 
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3 bg-gray-50/50 dark:bg-gray-900/30"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Box size={14} className="text-slate-500 dark:text-slate-400" /> แอดมิทเข้าหออภิบาล (IPD)
                  </h5>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={`admit-toggle-${petId}`}
                      checked={!!record.ipdCageId}
                      onChange={(e) => updatePetRecord(petId, 'ipdCageId', e.target.checked ? 'PENDING' : '')}
                      className="rounded border-gray-300 text-brand focus:ring-brand"
                      style={{ accentColor: brandColor }}
                    />
                    <label htmlFor={`admit-toggle-${petId}`} className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer">ต้องการแอดมิท</label>
                  </div>
                </div>

                {record.ipdCageId !== '' && (
                  <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">เลือกกรง</label>
                      <button
                        type="button"
                        onClick={() => setCageSelectorPetId(petId)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold flex items-center justify-between group hover:border-brand transition-all shadow-sm"
                      >
                        {record.ipdCageId && record.ipdCageId !== 'PENDING' ? (
                          <div className="flex items-center gap-2">
                             <div className="p-1 bg-brand/10 rounded-lg" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
                                <Box size={14} />
                             </div>
                             <span className="text-gray-900 dark:text-white">
                               {wards.flatMap(w => w.cages).find(c => c.id === record.ipdCageId)?.name || 'กรงที่เลือก'}
                             </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">คลิกเพื่อเลือกกรง...</span>
                        )}
                        <Search size={14} className="text-gray-400 group-hover:text-brand transition-colors" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <BrandInput 
                        label="หมายเหตุการกักตัว"
                        placeholder="เช่น งดน้ำ/อาหาร, สังเกตอาการ..."
                        value={record.ipdNotes}
                        onChange={e => updatePetRecord(petId, 'ipdNotes', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Lab Results Section */}
              <div 
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3 bg-gray-50/50 dark:bg-gray-900/30"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <FlaskConical size={14} className="text-slate-500 dark:text-slate-400" /> ผลตรวจทางห้องปฏิบัติการ (Lab Results)
                  </h5>
                  <button
                    type="button"
                    onClick={() => addLabTest(petId)}
                    className="text-sm font-bold text-brand uppercase hover:opacity-80 transition-opacity"
                    style={{ color: brandColor }}
                  >
                    + เพิ่มผลตรวจ Lab
                  </button>
                </div>

                {record.labTests && record.labTests.length > 0 ? (
                  <div className="space-y-4">
                    {record.labTests.map((test: any, index: number) => (
                      <div key={index} className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg space-y-3 relative group">
                        <button
                          onClick={() => removeLabTest(petId, index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-50 text-red-500 rounded-full border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <BrandInput
                            label="ประเภทการตรวจ"
                            placeholder="เช่น CBC, Blood Chem, X-Ray"
                            value={test.testType}
                            onChange={(e) => updateLabTest(petId, index, 'testType', e.target.value)}
                          />
                          <BrandInput
                            label="ผลตรวจ"
                            placeholder="เช่น Normal, High ALT..."
                            value={test.result}
                            onChange={(e) => updateLabTest(petId, index, 'result', e.target.value)}
                          />
                        </div>
                        
                        <BrandTextarea
                          label="หมายเหตุ"
                          rows={1}
                          value={test.notes}
                          onChange={(e) => updateLabTest(petId, index, 'notes', e.target.value)}
                        />

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase block">ไฟล์แนบ / รูปภาพ</label>
                          <div className="flex flex-wrap gap-2">
                            {test.files?.map((file: any, fIndex: number) => (
                              <div key={fIndex} className="flex items-center gap-2 p-1 pr-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded text-[10px] text-gray-600 dark:text-gray-400">
                                <span className="max-w-[100px] truncate">{file.name}</span>
                                <button 
                                  onClick={() => {
                                    const newFiles = [...test.files];
                                    newFiles.splice(fIndex, 1);
                                    updateLabTest(petId, index, 'files', newFiles);
                                  }}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                            <label className="flex items-center gap-1 p-1 px-2 border border-dashed border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:border-brand transition-colors text-[10px] text-gray-500">
                              <FileUp size={10} />
                              <span>อัปโหลด</span>
                              <input 
                                type="file" 
                                multiple 
                                className="hidden" 
                                onChange={(e) => handleFileChange(petId, index, e)}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic text-center py-2">ยังไม่มีข้อมูลการตรวจ Lab</p>
                )}
              </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <PetMedicineSelector 
                    selectedItems={record.medications || []}
                    onChange={(items) => updatePetRecord(petId, 'medications', items)}
                    petName={pet?.name}
                    customerName={`${customer.firstName} ${customer.lastName}`}
                  />
                </div>

            </div>
          );
        })}
      </div>

      {/* General Items Section */}
      <div className="mt-8 p-5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50">
        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <ShoppingCart size={18} /> สินค้าทั่วไป (ไม่ได้เจาะจงสัตว์)
        </h4>
        <PetMedicineSelector 
          selectedItems={generalItems}
          onChange={setGeneralItems}
          customerName={`${customer.firstName} ${customer.lastName}`}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <div 
          className="px-6 py-4 rounded-xl border flex flex-col gap-1 items-end min-w-64"
          style={{ 
            backgroundColor: brandColor + '08',
            borderColor: brandColor + '20',
            color: brandColor
          }}
        >
          <span className="text-sm opacity-80">รวมค่ายาและบริการ (สัตว์เลี้ยง): ฿{petMedsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span className="text-sm opacity-80">รวมค่าสินค้าทั่วไป: ฿{generalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <div className="h-px my-1 w-full opacity-20" style={{ backgroundColor: brandColor }} />
          <span className="text-lg font-bold">ยอดรวมสุทธิ: ฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">
          ยกเลิก
        </button>
        <BrandButton 
          onClick={handleSubmit} 
          disabled={createVisitMutation.isPending || selectedPets.length === 0}
        >
          {createVisitMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการเข้ารักษา'}
        </BrandButton>
      </div>

    </div>

      {/* Success Modal */}
      {createdVisit && (
        <VisitSuccessModal 
          isOpen={isSuccessOpen}
          onClose={onClose}
          visitData={createdVisit}
          customerName={`${customer.firstName} ${customer.lastName}`}
          onPrintLabels={() => setIsLabelPrintOpen(true)}
          onPrintInvoice={() => setIsInvoicePrintOpen(true)}
          onPrintAppointment={() => {
            setIsApptPrintOpen(true);
          }}
        />
      )}

      {/* Print Label Modal */}
      {createdVisit && isLabelPrintOpen && (
        <PrintLabelModal 
          isOpen={isLabelPrintOpen}
          onClose={() => setIsLabelPrintOpen(false)}
          petName={createdVisit.medicalRecords?.map((r: any) => r.pet?.name).join(', ') || ''}
          customerName={`${customer.firstName} ${customer.lastName}`}
          items={createdVisit.medicalRecords?.flatMap((r: any) => 
            (r.medications || []).map((m: any) => ({
              name: m.inventory?.name || m.inventoryName || m.name,
              quantity: m.quantity,
              usageInstructions: m.dosage || m.usageInstructions || ''
            }))
          ) || []}
        />
      )}

      {/* Print Invoice Modal */}
      {createdVisit?.invoice && isInvoicePrintOpen && (
        <PrintInvoiceModal 
          isOpen={isInvoicePrintOpen}
          onClose={() => setIsInvoicePrintOpen(false)}
          customerName={`${customer.firstName} ${customer.lastName}`}
          petNames={createdVisit.medicalRecords?.map((r: any) => r.pet?.name).join(', ') || ''}
          invoiceDate={new Date(createdVisit.invoice.createdAt).toLocaleDateString('th-TH')}
          invoiceNumber={createdVisit.invoice.id.slice(0, 8).toUpperCase()}
          items={createdVisit.invoice.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            medicalRecordId: item.medicalRecordId,
            id: item.id
          }))}
          totalAmount={createdVisit.invoice.totalAmount}
          discount={createdVisit.invoice.discount}
          netAmount={createdVisit.invoice.netAmount}
          paymentMethod={createdVisit.invoice.paymentMethod}
          medicalRecords={createdVisit.medicalRecords}
        />
      )}

      {/* Print Appointment Modal */}
      {createdVisit && isApptPrintOpen && (
        <PrintAppointmentModal 
          isOpen={isApptPrintOpen}
          onClose={() => {
            setIsApptPrintOpen(false);
          }}
          customerName={`${customer.firstName} ${customer.lastName}`}
          appointments={(createdVisit.medicalRecords || [])
            .filter((r: any) => r.nextAppointmentDate)
            .map((r: any) => ({
              petName: r.pet?.name || 'Unknown',
              date: new Date(r.nextAppointmentDate).toLocaleString('th-TH', { 
                year: 'numeric', month: 'long', day: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
              }),
              reason: r.nextAppointmentReason || 'Follow-up'
            }))
          }
        />
      )}

      {/* Confirm Save Modal */}
      <AlertModal 
        isOpen={isConfirmSaveOpen}
        onClose={() => setIsConfirmSaveOpen(false)}
        onConfirm={() => {
          setIsConfirmSaveOpen(false);
          handleSaveVisit();
        }}
        type="info"
        title="ยืนยันการบันทึก"
        description="คุณต้องการบันทึกข้อมูลการเข้ารักษาในครั้งนี้ใช่หรือไม่?"
        confirmText="บันทึกข้อมูล"
        cancelText="ตรวจสอบอีกครั้ง"
        loading={createVisitMutation.isPending}
      />

      {/* General Alert Modal */}
      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        description={alertConfig.description}
        type={alertConfig.type}
        confirmText="ตกลง"
      />

      <Modal
        isOpen={!!cageSelectorPetId}
        onClose={() => setCageSelectorPetId(null)}
        showCloseButton={false}
        className="sm:max-w-4xl rounded-3xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-brand/10 rounded-xl" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
                <Box size={24} />
             </div>
             <div>
                <h3 className="text-xl font-black">เลือกกรงและที่พัก (Boarding Selection)</h3>
                <p className="text-xs text-gray-500">ระบุกรงที่ต้องการให้สัตว์เลี้ยงพักอาศัย</p>
             </div>
          </div>
          <button onClick={() => setCageSelectorPetId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 bg-gray-50/50 dark:bg-gray-900/20">
          <CageGridSelector 
            wards={wards}
            selectedCageId={cageSelectorPetId ? petRecords[cageSelectorPetId]?.ipdCageId : undefined}
            onSelectCage={(cage) => {
              if (cageSelectorPetId) {
                updatePetRecord(cageSelectorPetId, 'ipdCageId', cage.id);
                setCageSelectorPetId(null);
              }
            }}
          />
        </div>
      </Modal>
    </>
  );
}

// ==========================================
// Read-Only Modal for Completed Appointments
// ==========================================

interface CompletedVisitDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: any; // GroupedAppointment from AppointmentsPage
}

export function CompletedVisitDetailsModal({ isOpen, onClose, group }: CompletedVisitDetailsModalProps) {
  const { brandColor } = useBranding();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  
  // Printing States
  const [isLabelPrintOpen, setIsLabelPrintOpen] = useState(false);
  const [isInvoicePrintOpen, setIsInvoicePrintOpen] = useState(false);
  const [isApptPrintOpen, setIsApptPrintOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [selectedPetIdForAppt, setSelectedPetIdForAppt] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && group) {
      loadVisits();
    }
  }, [isOpen, group]);

  const loadVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const appointmentId = group.originalAppointments?.[0]?.id;
      const data = await visitService.getVisits(group.customer.id, group.date, appointmentId);
      if (data && Array.isArray(data.data)) {
        setVisits(data.data);
      } else {
        setVisits([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'ไม่สามารถโหลดข้อมูลประวัติการรักษาได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      className="sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 size={24} style={{ color: brandColor }} />
            รายละเอียดการรักษา
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            เจ้าของ: {group.customer.firstName} {group.customer.lastName} | วันที่: {new Date(group.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900/10 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: brandColor }} />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center">
            {error}
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold text-gray-700 dark:text-gray-300">ไม่พบประวัติการรักษา (OPD)</p>
            <p className="text-sm mt-2 max-w-sm mx-auto">นัดหมายนี้อาจถูกปรับสถานะเป็น "เสร็จสิ้น" โดยตรง โดยไม่ได้ทำการบันทึกเวชระเบียน</p>
            
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 max-w-md mx-auto text-left px-6 text-xs">
               <h4 className="font-bold text-gray-400 uppercase mb-3 text-[10px] tracking-wider">ข้อมูลจากการนัดหมาย:</h4>
               {group.originalAppointments.map((app: any) => (
                 <div key={app.id} className="flex gap-3 mb-2 items-start bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-50 dark:border-gray-700">
                   <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg"><Dog size={16} className="text-gray-400" /></div>
                   <div>
                     <p className="font-bold text-gray-800 dark:text-gray-200">{app.pet?.name}</p>
                     <p className="text-gray-500 mt-0.5">เหตุผล: {app.reason || '-'}</p>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {visits.map((visit, index) => (
              <div key={visit.id} className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-full">รอบที่ {index + 1}</span>
                   <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700" />
                </div>

                {visit.medicalRecords?.map((record: any) => (
                  <div key={record.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50/50 dark:bg-gray-800/50 p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="bg-white dark:bg-gray-900 p-2 rounded-xl shadow-sm"><Dog size={24} style={{ color: brandColor }} /></div>
                        <div>
                           <h3 className="font-bold text-gray-900 dark:text-gray-100">{record.pet?.name}</h3>
                           <p className="text-xs text-gray-500 font-medium">สัตวแพทย์: {record.vet?.firstName} {record.vet?.lastName || ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-6 text-xs text-gray-500">
                        <div className="text-center">
                          <p className="font-bold text-gray-900 dark:text-gray-200">
                            {record.weightAtVisit || record.pet?.weight || '-'} kg
                          </p>
                          <p className="scale-90 opacity-70">น้ำหนัก</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-gray-900 dark:text-gray-200">{record.temperature || '-'} °C</p>
                          <p className="scale-90 opacity-70">อุณหภูมิ</p>
                        </div>
                      </div>
                    </div>

                        <div className="px-6 py-2 bg-gray-50/30 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-700 flex gap-2">
                           {record.medications && record.medications.length > 0 && (
                             <button 
                               onClick={() => {
                                 setPrintData(visit);
                                 setIsLabelPrintOpen(true);
                               }}
                               className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors border"
                               style={{ 
                                 backgroundColor: brandColor + '08',
                                 borderColor: brandColor + '20',
                                 color: brandColor
                               }}
                             >
                               <Printer size={12} /> พิมพ์ฉลากยา
                             </button>
                           )}
                       {record.nextAppointmentDate && (
                         <button 
                           onClick={() => {
                             setPrintData(visit);
                             setSelectedPetIdForAppt(record.petId);
                             setIsApptPrintOpen(true);
                           }}
                           className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 text-[10px] font-bold transition-colors border border-orange-100"
                         >
                           <Calendar size={12} /> พิมพ์ใบนัด
                         </button>
                       )}
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { title: "อาการเบื้องต้น", value: record.symptoms },
                          { title: "การวินิจฉัย", value: record.diagnosis },
                          { title: "แผนการรักษา", value: record.treatment },
                          { title: "อธิบายเพิ่มเติม", value: record.notes }
                        ].map((sec, i) => (
                          <div key={i} className={cn(
                            "space-y-1.5",
                            sec.title === "อธิบายเพิ่มเติม" ? "md:col-span-3" : ""
                          )}>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{sec.title}</h4>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-sm text-gray-700 dark:text-gray-300 min-h-[60px]">
                               {sec.value || '-'}
                            </div>
                          </div>
                        ))}
                      </div>

                      {record.admission && (
                        <div 
                          className="mt-4 p-4 rounded-2xl border flex items-center gap-3"
                          style={{ 
                            backgroundColor: brandColor + '08', 
                            borderColor: brandColor + '20' 
                          }}
                        >
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: brandColor + '15', color: brandColor }}
                          >
                             <Box size={20} />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-[10px] font-black uppercase tracking-widest px-1 opacity-70" style={{ color: brandColor }}>ข้อมูลแอดมิท (IPD Admission)</h4>
                            <p className="text-sm font-bold" style={{ color: brandColor }}>
                              {record.admission.cage?.ward?.name || 'ไม่ระบุห้อง'} - {record.admission.cage?.name || 'ไม่ระบุกรง'}
                            </p>
                            {(record.admission.reason || record.admission.notes) && (
                              <div className="mt-1 text-xs italic leading-relaxed opacity-70" style={{ color: brandColor }}>
                                {record.admission.reason && <span className="mr-2">สาเหตุ: {record.admission.reason}</span>}
                                {record.admission.notes && <span>(หมายเหตุ: {record.admission.notes})</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {record.medications && record.medications.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-3">รายการยาและสินค้า</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {record.medications.map((med: any) => (
                              <div key={med.id} className="flex justify-between items-start p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs hover:border-brand/30 transition-colors gap-4">
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-gray-900 dark:text-gray-100">{med.inventory?.name || med.inventoryName || med.name}</p>
                                  <p className="text-gray-500 mt-1 leading-relaxed break-words">{med.dosage || med.usageInstructions || '-'}</p>
                                </div>
                                <div className="text-right whitespace-nowrap pt-0.5">
                                  <span className="font-bold text-brand" style={{ color: brandColor }}>x{med.quantity}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Invoice Summary */}
            {visits[0]?.invoice && (
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart size={18} className="text-blue-500" />
                    สรุปค่าใช้จ่าย
                  </h4>
                  <button 
                    onClick={() => {
                      setPrintData(visits[0]);
                      setIsInvoicePrintOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold transition-colors border border-emerald-100"
                  >
                    <Receipt size={14} /> พิมพ์ใบเสร็จ
                  </button>
                </div>
                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <span className="text-sm text-gray-500 font-medium">ยอดชำระสุทธิ</span>
                  <span className="text-xl font-black text-gray-900 dark:text-white" style={{ color: brandColor }}>
                    ฿{visits[0].invoice.netAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-center bg-gray-50/50 dark:bg-gray-800/50">
        <BrandButton onClick={onClose} className="px-12 rounded-full">
          ปิดหน้าต่าง
        </BrandButton>
      </div>

      {/* Printing Modals Reused */}
      {printData && (
        <>
          <PrintLabelModal 
            isOpen={isLabelPrintOpen}
            onClose={() => setIsLabelPrintOpen(false)}
            petName={printData.medicalRecords?.map((r: any) => r.pet?.name).join(', ') || ''}
            customerName={`${group.customer.firstName} ${group.customer.lastName}`}
            items={printData.medicalRecords?.flatMap((r: any) => 
              (r.medications || []).map((m: any) => ({
                name: m.inventory?.name || m.inventoryName || m.name,
                quantity: m.quantity,
                usageInstructions: m.dosage || m.usageInstructions || ''
              }))
            ) || []}
          />

          {printData.invoice && (
            <PrintInvoiceModal 
              isOpen={isInvoicePrintOpen}
              onClose={() => setIsInvoicePrintOpen(false)}
              customerName={`${group.customer.firstName} ${group.customer.lastName}`}
              petNames={printData.medicalRecords?.map((r: any) => r.pet?.name).join(', ') || ''}
              invoiceDate={new Date(printData.invoice.createdAt).toLocaleDateString('th-TH')}
              invoiceNumber={printData.invoice.id.slice(0, 8).toUpperCase()}
              items={printData.invoice.items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                medicalRecordId: item.medicalRecordId,
                id: item.id
              }))}
              totalAmount={printData.invoice.totalAmount}
              discount={printData.invoice.discount}
              netAmount={printData.invoice.netAmount}
              paymentMethod={printData.invoice.paymentMethod}
              medicalRecords={printData.medicalRecords}
            />
          )}

          {isApptPrintOpen && (
            <PrintAppointmentModal 
              isOpen={isApptPrintOpen}
              onClose={() => {
                setIsApptPrintOpen(false);
              }}
              customerName={`${group.customer.firstName} ${group.customer.lastName}`}
              appointments={(printData.medicalRecords || [])
                .filter((r: any) => r.nextAppointmentDate)
                .map((r: any) => ({
                  petName: r.pet?.name || 'Unknown',
                  date: new Date(r.nextAppointmentDate).toLocaleString('th-TH', { 
                    year: 'numeric', month: 'long', day: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                  }),
                  reason: r.nextAppointmentReason || 'Follow-up'
                }))
              }
            />
          )}
        </>
      )}
    </Modal>
  );
}
