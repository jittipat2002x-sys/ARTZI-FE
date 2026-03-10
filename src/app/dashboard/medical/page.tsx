'use client';

import React, { useState, useEffect, useRef } from 'react';
import { visitService, Visit } from '@/services/visit.service';
import { useBranding } from '@/contexts/branding-context';
import { DataTable, Column } from '@/components/ui/data-table';
import { ThaiDateInput } from '@/components/ui/thai-date-input';
import {
  Calendar,
  Clock,
  Dog,
  User,
  History,
  Pill,
  Syringe,
  Stethoscope,
  Activity,
  FileText,
  AlertCircle,
  Printer,
  Receipt,
  Box
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { PrintInvoiceModal } from '../customers/components/PrintInvoiceModal';
import { PrintAppointmentModal } from '../customers/components/PrintAppointmentModal';
import { PrintLabelModal } from '../customers/components/PrintLabelModal';
import { BrandInput } from '@/components/ui/brand-input';

export default function MedicalHistoryPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const { brandColor } = useBranding();

  // Filter
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState<string>('');
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  // Print States
  const [printData, setPrintData] = useState<Visit | null>(null);
  const [isLabelPrintOpen, setIsLabelPrintOpen] = useState(false);
  const [isInvoicePrintOpen, setIsInvoicePrintOpen] = useState(false);
  const [isApptPrintOpen, setIsApptPrintOpen] = useState(false);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const response = await visitService.getVisits(undefined, selectedDate, undefined, search, page, LIMIT);
      setVisits(response.data || []);
      setTotalPages(Math.max(1, response.meta?.lastPage || 1));
    } catch (error) {
      console.error('Failed to load visits', error);
      setVisits([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const prevSearch = useRef(search);
  const prevDate = useRef(selectedDate);

  // Reset page relative to search/filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedDate, search]);

  useEffect(() => {
    // Check if what changed was a search or date filter (typing) vs just a page change
    const isTyping = search !== prevSearch.current || selectedDate !== prevDate.current;
    prevSearch.current = search;
    prevDate.current = selectedDate;

    const delay = isTyping ? 500 : 0;

    const timeoutId = setTimeout(() => {
      loadVisits();
    }, delay);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, search, page]);

  const columns: Column<Visit>[] = [
    {
      header: 'วันและเวลา',
      cell: (visit) => {
        const visitDateObj = new Date(visit.visitDate);
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
              <Calendar size={14} className="text-gray-400" />
              {visitDateObj.toLocaleDateString('th-TH', { 
                 year: 'numeric', month: '2-digit', day: '2-digit'
              })}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} className="text-gray-400" />
              {visitDateObj.toLocaleTimeString('th-TH', {
                 hour: '2-digit', minute: '2-digit'
              })} น.
            </div>
          </div>
        );
      }
    },
    {
      header: 'เจ้าของสัตว์',
      cell: (visit) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            <User size={14} style={{ color: brandColor }} />
            {visit.customer?.firstName} {visit.customer?.lastName}
          </div>
          <div className="text-xs text-gray-500">
            {visit.customer?.phone ? `โทร: ${visit.customer.phone}` : '-'}
          </div>
        </div>
      )
    },
    {
      header: 'สัตว์เลี้ยงที่เข้ารักษา',
      cell: (visit) => {
        const pets = visit.medicalRecords?.map(record => record.pet) || [];
        // Deduplicate pets if needed, though usually one record per pet per visit
        const uniquePets = Array.from(new Map(pets.map((p: any) => [p.id, p])).values()) as any[];

        return (
          <div className="flex flex-wrap gap-2">
            {uniquePets.map(pet => (
              <div key={pet.id} className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                <Dog size={12} style={{ color: brandColor }} />
                {pet.name} <span className="font-normal text-[10px] text-gray-400">({pet.species})</span>
              </div>
            ))}
            {uniquePets.length === 0 && <span className="text-gray-400 text-xs">-</span>}
          </div>
        );
      }
    },
    {
      header: 'จัดการ',
      cell: (visit) => (
        <button
          onClick={() => setExpandedVisitId(expandedVisitId === visit.id ? null : visit.id)}
          className="flex items-center gap-1.5 p-1.5 px-3 rounded-lg transition-all border font-bold text-xs hover:opacity-80"
          style={{ 
            color: brandColor, 
            borderColor: `${brandColor}30`,
            backgroundColor: expandedVisitId === visit.id ? `${brandColor}15` : 'transparent'
          }}
          title={expandedVisitId === visit.id ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียดการรักษา'}
        >
          {expandedVisitId === visit.id ? (
            <>
              <span>ซ่อนรายละเอียด</span>
            </>
          ) : (
            <>
              <History size={14} />
              <span>ดูรายละเอียด</span>
            </>
          )}
        </button>
      )
    }
  ];

  const renderExpandedRecord = (visit: Visit) => {
    if (!visit.medicalRecords || visit.medicalRecords.length === 0) {
      return (
        <div className="p-6 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl my-4 mx-6">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>ไม่มีบันทึกการรักษาในรายการนี้</p>
        </div>
      );
    }

    return (
      <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Stethoscope size={16} style={{ color: brandColor }} />
            รายละเอียดการรักษาแต่ละตัว
          </h3>
          <div className="flex gap-2">
            {visit.medicalRecords.some(r => r.medications && r.medications.length > 0) && (
              <button 
                onClick={() => {
                  setPrintData(visit);
                  setIsLabelPrintOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border"
                style={{ 
                  backgroundColor: brandColor + '08',
                  borderColor: brandColor + '20',
                  color: brandColor
                }}
              >
                <Printer size={14} /> พิมพ์ฉลากยาทั้งหมด
              </button>
            )}
            {visit.appointments && visit.appointments.length > 0 && (
              <button 
                onClick={() => {
                  setPrintData(visit);
                  setIsApptPrintOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border"
                style={{ 
                  backgroundColor: brandColor + '08',
                  borderColor: brandColor + '20',
                  color: brandColor
                }}
              >
                <Calendar size={14} /> พิมพ์ใบนัดทั้งหมด
              </button>
            )}
            {visit.invoice && (
              <button 
                onClick={() => {
                  setPrintData(visit);
                  setIsInvoicePrintOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border"
                style={{ 
                  backgroundColor: brandColor + '08',
                  borderColor: brandColor + '20',
                  color: brandColor
                }}
              >
                <Receipt size={14} /> พิมพ์ใบเสร็จ
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {visit.medicalRecords.map((record) => (
            <div key={record.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
                    <Dog size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-gray-900 dark:text-white">{record.pet?.name}</h4>
                    <p className="text-xs text-gray-500">{record.pet?.species} {record.pet?.breed ? `• ${record.pet.breed}` : ''}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  {(record as any).weightAtVisit > 0 && (
                    <span 
                      className="text-xs font-medium px-2 py-0.5 rounded-md border flex items-center gap-1"
                      style={{ 
                        backgroundColor: brandColor + '08',
                        borderColor: brandColor + '20',
                        color: brandColor
                      }}
                    >
                      น้ำหนัก: {(record as any).weightAtVisit} กก.
                    </span>
                  )}
                  {(record as any).temperature > 0 && (
                    <span 
                      className="text-xs font-medium px-2 py-0.5 rounded-md border flex items-center gap-1"
                      style={{ 
                        backgroundColor: brandColor + '08',
                        borderColor: brandColor + '20',
                        color: brandColor
                      }}
                    >
                      อุณหภูมิ: {(record as any).temperature} °C
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {record.symptoms && (
                  <div>
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Activity size={12} /> อาการที่พบ
                    </h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg">
                      {record.symptoms}
                    </p>
                  </div>
                )}
                
                {record.diagnosis && (
                  <div>
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Stethoscope size={12} /> การวินิจฉัย
                    </h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border-l-2" style={{ borderLeftColor: brandColor }}>
                      {record.diagnosis}
                    </p>
                  </div>
                )}

                {record.treatment && (
                  <div>
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Syringe size={12} /> การรักษาที่ทำ
                    </h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg">
                      {record.treatment}
                    </p>
                  </div>
                )}

                {record.prescription && (
                  <div>
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FileText size={12} /> ใบสั่งยา / คำแนะนำ
                    </h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg">
                      {record.prescription}
                    </p>
                  </div>
                )}

                {record.admission && (
                  <div 
                    className="mt-2 p-3 rounded-xl border flex items-center gap-2"
                    style={{ 
                      backgroundColor: brandColor + '08',
                      borderColor: brandColor + '20'
                    }}
                  >
                    <Box size={16} style={{ color: brandColor }} />
                    <div className="text-xs">
                      <span className="font-bold" style={{ color: brandColor }}>แอดมิท (IPD):</span>
                      <span className="ml-1 opacity-80" style={{ color: brandColor }}>
                        {record.admission.cage?.ward?.name || 'ไม่ระบุห้อง'} - {record.admission.cage?.name || 'ไม่ระบุกรง'}
                      </span>
                      {(record.admission.reason || record.admission.notes) && (
                        <div className="mt-1 text-[10px] italic opacity-70" style={{ color: brandColor }}>
                          {record.admission.reason && <span className="mr-2">สาเหตุ: {record.admission.reason}</span>}
                          {record.admission.notes && <span>(หมายเหตุ: {record.admission.notes})</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {record.medications && record.medications.length > 0 && (
                  <div className="pt-2">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Pill size={12} /> รายการยา / สินค้าที่ใช้
                    </h5>
                    <div className="space-y-2">
                      {record.medications.map((med: any) => (
                        <div key={med.id} className="flex items-start justify-between text-sm p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {med.inventory?.name || med.name || 'ไม่มีชื่อสินค้า'}
                            </span>
                            {(med.dosage || med.instructions) && (
                              <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                                {med.dosage || med.instructions}
                              </span>
                            )}
                          </div>
                          <span className="font-bold whitespace-nowrap px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-xs" style={{ color: brandColor }}>
                            {med.quantity} {med.inventory?.unit || ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {record.notes && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FileText size={12} /> อธิบายเพิ่มเติม (Additional Notes)
                    </h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic bg-gray-50/50 dark:bg-gray-900/30 p-2 rounded-lg">
                      {record.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* General Merchandise rendering */}
        {visit.invoice && visit.invoice.items?.filter((i: any) => !i.medicalRecordId).length > 0 && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">สินค้าทั่วไป / บริการอื่น ๆ</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visit.invoice.items.filter((i: any) => !i.medicalRecordId).map((item: any) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl text-xs flex-col">
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{item.name}</span>
                  </div>
                  <div className="flex justify-between w-full mt-2 items-end">
                    <span className="text-gray-500">
                      ฿{item.unitPrice.toLocaleString()} x {item.quantity}
                    </span>
                    <span className="font-bold text-brand" style={{ color: brandColor }}>
                      ฿{item.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6" style={{ color: brandColor }} />
            ประวัติการรักษา
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            รายการประวัติการรักษาแบบกลุ่มตามเจ้าของสัตว์
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-none border border-gray-200 dark:border-gray-700 mb-6">
        <div className="w-full">
          <label className="text-xs font-medium text-gray-500 mb-1 block">ค้นหา</label>
          <BrandInput
            placeholder="ค้นหาชื่อ, เบอร์โทร, Line ID, หรือชื่อ/Tag สัตว์เลี้ยง..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setExpandedVisitId(null);
            }}
          />
        </div>
        <div className="w-full">
          <label className="text-xs font-medium text-gray-500 mb-1 block">วันที่</label>
          <ThaiDateInput
            value={selectedDate}
            onChange={(val) => {
              setSelectedDate(val);
              setExpandedVisitId(null);
            }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={visits}
        loading={loading}
        emptyIcon={History}
        emptyText="ไม่พบประวัติการรักษาในวันที่เลือก"
        keyExtractor={(v) => v.id}
        expandedRowId={expandedVisitId}
        renderExpandedRow={renderExpandedRecord}
      />
      
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Printing Modals */}
      {printData && (
        <>
          {isLabelPrintOpen && (
            <PrintLabelModal 
              isOpen={isLabelPrintOpen}
              onClose={() => setIsLabelPrintOpen(false)}
              petName={printData.medicalRecords?.map((r: any) => r.pet?.name).join(', ') || ''}
              customerName={`${printData.customer?.firstName || ''} ${printData.customer?.lastName || ''}`}
              items={printData.medicalRecords?.flatMap((r: any) => 
                (r.medications || []).map((m: any) => ({
                  name: m.inventory?.name || m.inventoryName || m.name,
                  quantity: m.quantity,
                  usageInstructions: m.dosage || m.usageInstructions || ''
                }))
              ) || []}
            />
          )}

          {printData.invoice && isInvoicePrintOpen && (
            <PrintInvoiceModal 
              isOpen={isInvoicePrintOpen}
              onClose={() => setIsInvoicePrintOpen(false)}
              customerName={`${printData.customer?.firstName || ''} ${printData.customer?.lastName || ''}`}
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
              onClose={() => setIsApptPrintOpen(false)}
              customerName={`${printData.customer?.firstName || ''} ${printData.customer?.lastName || ''}`}
              appointments={(printData.appointments || []).map((appt: any) => ({
                petName: appt.pet?.name || 'Unknown',
                date: new Date(appt.date).toLocaleString('th-TH', { 
                  year: 'numeric', month: 'long', day: 'numeric', 
                  hour: '2-digit', minute: '2-digit' 
                }),
                reason: appt.reason || 'Follow-up'
              }))}
            />
          )}
        </>
      )}
    </div>
  );
}
