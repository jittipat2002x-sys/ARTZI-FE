'use client';

import React, { useState, useEffect } from 'react';
import { appointmentService, Appointment } from '@/services/appointment.service';
import { BrandButton } from '@/components/ui/brand-button';
import { useBranding } from '@/contexts/branding-context';
import { DataTable, Column } from '@/components/ui/data-table';
import { ThaiDateInput } from '@/components/ui/thai-date-input';
import { BrandInput } from '@/components/ui/brand-input';
import { AlertModal } from '@/components/ui/modal';
import { authService } from '@/services/auth.service';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { VisitPanel, CompletedVisitDetailsModal } from '../customers/components/VisitPanel';
import {
  Calendar,
  Clock,
  Dog,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  Stethoscope,
  History,
  LayoutList,
} from 'lucide-react';
import { format } from 'date-fns';
import { CreateAppointmentForm } from './components/CreateAppointmentForm';
import { AppointmentCalendar } from './components/AppointmentCalendar';

interface GroupedAppointment {
  id: string; // Combined ID for React keys, usually just customerId_date
  date: string; // The normalized date string (YYYY-MM-DD)
  customer: Appointment['pet']['customer'];
  originalAppointments: Appointment[]; // The raw appointments in this group
}

export default function AppointmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<GroupedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { brandColor } = useBranding();

  // Filters
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const prevSearch = React.useRef(search);

  // Modals
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [createFormPrefillDate, setCreateFormPrefillDate] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<GroupedAppointment | null>(null);
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<string[]>([]);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info',
    onConfirm: () => {},
  });

  const [partialActionModal, setPartialActionModal] = useState<{
    isOpen: boolean;
    group: GroupedAppointment | null;
    status: Appointment['status'] | null;
  }>({
    isOpen: false,
    group: null,
    status: null,
  });

  const [partialSelectedIds, setPartialSelectedIds] = useState<string[]>([]);

  const [expandedVisitAppointmentId, setExpandedVisitAppointmentId] = useState<string | null>(null);
  const [viewCompletedVisitGroup, setViewCompletedVisitGroup] = useState<GroupedAppointment | null>(null);

  const loadAppointments = async (page = 1) => {
    setLoading(true);
    try {
      const isCalendarView = viewMode === 'calendar';
      const fetchLimit = isCalendarView ? 1000 : 10;
      const fetchDate = isCalendarView ? format(currentMonthDate, 'yyyy-MM') : (selectedDate || undefined);

      const response = await appointmentService.getAppointments(page, fetchLimit, statusFilter, selectedBranchId, fetchDate, search);
      
      let items: any[] = [];
      let totalPagesCount = 1;

      if (Array.isArray(response)) {
        // Fallback for old API structure
        items = response;
        totalPagesCount = 1;
      } else if (response && response.data) {
        // New paginated structure
        items = response.data;
        totalPagesCount = response.meta?.lastPage || 1;
      }
      
      setTotalPages(totalPagesCount);
      setCurrentPage(page);

      // Group by Customer ID + Date (ignoring time for grouping)
      const groupedMap = new Map<string, GroupedAppointment>();

      items.forEach((app: Appointment) => {
        const dateStr = app.date.includes('T') ? app.date.split('T')[0] : format(new Date(app.date), 'yyyy-MM-dd');
        const customerId = app.pet.customer.id;
        const groupKey = `${customerId}_${dateStr}`;

        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, {
            id: groupKey,
            date: dateStr,
            customer: app.pet.customer,
            originalAppointments: []
          });
        }
        groupedMap.get(groupKey)!.originalAppointments.push(app);
      });

      // Convert back to array
      const groupedArray = Array.from(groupedMap.values());
      // Sort by date/time (Note: Backend already sorts, but grouping might shuffle)
      groupedArray.sort((a, b) => {
         const timeA = new Date(a.originalAppointments[0].date).getTime();
         const timeB = new Date(b.originalAppointments[0].date).getTime();
         return timeB - timeA;
      });

      setAppointments(groupedArray);
    } catch (error) {
      console.error('Failed to load appointments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(authService.getUser());
  }, []);

  useEffect(() => {
    const isTyping = search !== prevSearch.current;
    prevSearch.current = search;
    const delay = isTyping ? 500 : 0;

    const timeoutId = setTimeout(() => {
      loadAppointments(viewMode === 'calendar' ? 1 : currentPage);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [currentPage, selectedBranchId, statusFilter, search, selectedDate, viewMode, currentMonthDate]);

  const handleUpdateStatus = async (group: GroupedAppointment, status: Appointment['status']) => {
    const scheduledApps = group.originalAppointments.filter(a => a.status === 'SCHEDULED');
    if (scheduledApps.length === 0) return;

    const actionName = status === 'CANCELLED' ? 'ยกเลิก' : status === 'COMPLETED' ? 'เสร็จสิ้น' : 'อัปเดต';
    const countText = scheduledApps.length > 1 ? ` ทั้ง ${scheduledApps.length} รายการ` : '';

    setAlertModal({
      isOpen: true,
      title: `ยืนยันการ${actionName}นัดหมาย`,
      description: `คุณแน่ใจหรือไม่ว่าต้องการเปลี่ยนสถานะการนัดหมายนี้เป็น "${actionName}"${countText}?`,
      type: status === 'CANCELLED' ? 'danger' : 'success',
      confirmText: `ยืนยัน`,
      onConfirm: async () => {
        try {
          await Promise.all(
            scheduledApps.map(app => appointmentService.update(app.id, { status }))
          );
          setAlertModal(prev => ({ ...prev, isOpen: false }));
          loadAppointments();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const openRescheduleModal = (group: GroupedAppointment) => {
    setSelectedGroup(group);
    const scheduledApps = group.originalAppointments.filter(a => a.status === 'SCHEDULED');
    setSelectedAppointmentIds(scheduledApps.map(a => a.id));
    
    const firstApp = scheduledApps[0] || group.originalAppointments[0];
    const dateObj = new Date(firstApp.date);
    setNewDate(dateObj.toISOString());
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const mins = String(dateObj.getMinutes()).padStart(2, '0');
    setNewTime(`${hours}:${mins}`);
    setIsRescheduleModalOpen(true);
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !newDate || !newTime) return;

    try {
      const [year, month, day] = newDate.split('T')[0].split('-').map(Number);
      const [hours, minutes] = newTime.split(':').map(Number);
      const combinedDate = new Date(year, month - 1, day, hours, minutes);

      const appointmentsToUpdate = selectedGroup.originalAppointments.filter(a => 
        selectedAppointmentIds.includes(a.id)
      );

      await Promise.all(
        appointmentsToUpdate.map(app => 
          appointmentService.update(app.id, {
            date: combinedDate.toISOString(),
          })
        )
      );

      setIsRescheduleModalOpen(false);
      loadAppointments();
      setAlertModal({
        isOpen: true,
        title: 'เลื่อนนัดหมายสำเร็จ',
        description: `ข้อมูลการนัดหมายถูกเลื่อนเรียบร้อยแล้ว (${appointmentsToUpdate.length} รายการ)`,
        type: 'success',
        confirmText: 'ตกลง',
        onConfirm: () => setAlertModal(p => ({ ...p, isOpen: false }))
      });
    } catch (error) {
      console.error(error);
      setAlertModal({
        isOpen: true,
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเลื่อนนัดหมายได้ กรุณาลองใหม่อีกครั้ง',
        type: 'danger',
        confirmText: 'ตกลง',
        onConfirm: () => setAlertModal(p => ({ ...p, isOpen: false }))
      });
    }
  };

  const columns: Column<GroupedAppointment>[] = [
    {
      header: 'วันและเวลา',
      cell: (group) => {
         // Display time of the first appointment, or a range if they differ significantly
         const firstApp = group.originalAppointments[0];
         return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
              <Calendar size={14} className="text-gray-400" />
              {new Date(firstApp.date).toLocaleDateString('th-TH', { 
                 year: 'numeric', month: '2-digit', day: '2-digit'
              })}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} className="text-gray-400" />
              {new Date(firstApp.date).toLocaleTimeString('th-TH', {
                 hour: '2-digit', minute: '2-digit'
              })} น.
              {group.originalAppointments.length > 1 && <span className="text-xs ml-1 font-medium" style={{ color: brandColor }}>({group.originalAppointments.length} คิว)</span>}
            </div>
          </div>
         );
      }
    },
    {
      header: 'ข้อมูลสัตว์เลี้ยง/เจ้าของ',
      cell: (group) => (
        <div>
          <div className="text-xs text-gray-500 flex items-center gap-2 mb-1">
            <User size={12} />
            {group.customer.firstName} {group.customer.lastName}
            {group.customer.phone && ` (${group.customer.phone})`}
          </div>
          <div className="flex flex-wrap gap-2">
            {group.originalAppointments.map(app => (
              <div key={app.id} className="font-bold text-gray-900 dark:text-white flex items-center gap-1 text-sm bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                <Dog size={12} style={{ color: brandColor }} />
                {app.pet.name} <span className="font-normal text-[10px] text-gray-400">({app.pet.species})</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      header: 'สาเหตุการนัด',
      cell: (group) => (
        <div className="flex flex-col gap-1">
          {group.originalAppointments.map(app => (
            <div key={app.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
               <span className="font-medium">{app.pet.name}:</span> {app.reason}
            </div>
          ))}
        </div>
      )
    },
    {
      header: 'สถานะรวม',
      cell: (group) => {
        // If all completed -> Completed
        // If all cancelled -> Cancelled
        // Else -> Scheduled
        const allCompleted = group.originalAppointments.every(a => a.status === 'COMPLETED');
        const allCancelled = group.originalAppointments.every(a => a.status === 'CANCELLED');
        const allNoShow = group.originalAppointments.every(a => a.status === 'NO_SHOW');

        let bgClass = 'bg-blue-100 text-blue-700';
        let label = 'รอดำเนินการ';
        
        if (allCompleted) { bgClass = 'bg-green-100 text-green-700'; label = 'เสร็จสิ้น'; }
        else if (allCancelled) { bgClass = 'bg-red-100 text-red-700'; label = 'ยกเลิกทั้งหมด'; }
        else if (allNoShow) { bgClass = 'bg-gray-200 text-gray-800'; label = 'ไม่มาตามนัด'; }

        return (
          <div className="flex flex-col gap-1 items-start">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${bgClass}`}>
              {label}
            </span>
            {group.originalAppointments.some(a => a.status !== 'SCHEDULED') && !allCompleted && !allCancelled && !allNoShow && (
              <span className="text-[10px] text-gray-400">ทำรายการบางส่วนแล้ว</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'จัดการ',
      cell: (group) => {
        // Find if there are any pending appointments in this group
        const hasPending = group.originalAppointments.some(a => a.status === 'SCHEDULED');
        
        return (
           <div className="flex items-center gap-2">
              {hasPending ? (
                <>
                  <button
                    onClick={() => setExpandedVisitAppointmentId(
                      expandedVisitAppointmentId === group.id ? null : group.id
                    )}
                    className="flex items-center gap-1.5 p-1.5 px-3 rounded-lg transition-colors border"
                    style={{ 
                      color: brandColor, 
                      borderColor: brandColor + '20',
                      backgroundColor: brandColor + '08' 
                    }}
                    title="บันทึกการรักษา"
                  >
                    <Stethoscope size={16} />
                    <span className="text-xs font-bold">ตรวจ</span>
                  </button>
                  <button
                    onClick={() => openRescheduleModal(group)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="เลื่อนนัด"
                  >
                    <CalendarDays size={18} />
                  </button>
                  <button
                    onClick={() => {
                      const scheduledApps = group.originalAppointments.filter(a => a.status === 'SCHEDULED');
                      if (scheduledApps.length > 1) {
                        setPartialSelectedIds(scheduledApps.map(a => a.id));
                        setPartialActionModal({ isOpen: true, group, status: 'CANCELLED' });
                      } else {
                        handleUpdateStatus(group, 'CANCELLED');
                      }
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="ยกเลิก"
                  >
                    <XCircle size={18} />
                  </button>
                </>
              ) : (
                group.originalAppointments.every(a => a.status === 'COMPLETED') ? (
                  <button
                    onClick={() => setViewCompletedVisitGroup(group)}
                    className="flex items-center gap-1.5 p-1.5 px-3 rounded-lg transition-all border font-bold text-xs"
                    style={{ 
                      color: brandColor, 
                      borderColor: `${brandColor}30`,
                      backgroundColor: `${brandColor}08` 
                    }}
                    title="ดูรายละเอียด"
                  >
                    <History size={14} />
                    <span>ดูรายละเอียด</span>
                  </button>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )
              )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays size={28} style={{ color: brandColor }} /> จัดการนัดหมาย
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            รายการนัดหมายล่วงหน้าและประวัติการนัดหมาย
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setViewMode('table');
                setCurrentPage(1);
              }}
              className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm font-medium' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              style={viewMode === 'table' ? { color: brandColor } : {}}
            >
              <LayoutList size={20} />
            </button>
            <button
              onClick={() => {
                setViewMode('calendar');
                setCurrentPage(1);
              }}
              className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                viewMode === 'calendar' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm font-medium' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              style={viewMode === 'calendar' ? { color: brandColor } : {}}
            >
              <CalendarDays size={20} />
            </button>
          </div>
          <BrandButton
            onClick={() => {
              if (isCreateFormOpen) {
                setIsCreateFormOpen(false);
                setCreateFormPrefillDate('');
              } else {
                setCreateFormPrefillDate('');
                setIsCreateFormOpen(true);
                setExpandedVisitAppointmentId(null);
              }
            }}
            className="rounded-full px-6 shadow-md whitespace-nowrap flex-1 sm:flex-none"
          >
            {isCreateFormOpen ? '- ปิดฟอร์ม' : '+ สร้างนัดหมาย'}
          </BrandButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-none border border-gray-200 dark:border-gray-700 mb-6">
        <div className="w-full">
          <label className="text-xs font-medium text-gray-500 mb-1 block">ค้นหา</label>
          <BrandInput
            placeholder="ค้นหาชื่อสัตว์เลี้ยง, เจ้าของ, หรือเบอร์โทร..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="w-full">
          <label className="text-xs font-medium text-gray-500 mb-1 block">สถานะ</label>
          <SearchableSelect
            options={[
              { id: 'all', name: 'ทั้งหมด' },
              { id: 'SCHEDULED', name: 'รอดำเนินการ' },
              { id: 'COMPLETED', name: 'เสร็จสิ้น' },
              { id: 'CANCELLED', name: 'ยกเลิก' },
            ]}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            searchPlaceholder="ค้นหาสถานะ..."
          />
        </div>
        <div className="w-full">
          <label className="text-xs font-medium text-gray-500 mb-1 block">กรองตามสาขา</label>
          <SearchableSelect
            options={[
              { id: 'all', name: 'ทุกสาขา' },
              ...(user?.branches?.map((bs: any) => ({
                id: bs.branchId,
                name: bs.branch?.name || 'สาขาปัจจุบัน'
              })) || [])
            ]}
            value={selectedBranchId}
            onChange={(val) => {
              setSelectedBranchId(val);
              setCurrentPage(1);
            }}
            placeholder="เลือกสาขา..."
            icon={MapPin}
          />
        </div>
        <div className="w-full">
          <label className="text-xs font-medium text-gray-500 mb-1 block">วันที่</label>
          <ThaiDateInput
            value={selectedDate}
            onChange={(val) => {
              setSelectedDate(val);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {isCreateFormOpen && (
        <CreateAppointmentForm
          initialDate={createFormPrefillDate}
          onCancel={() => {
            setIsCreateFormOpen(false);
            setCreateFormPrefillDate('');
          }}
          onSuccess={() => {
            setIsCreateFormOpen(false);
            setCreateFormPrefillDate('');
            loadAppointments();
          }}
        />
      )}

      {viewMode === 'calendar' && expandedVisitAppointmentId && !isCreateFormOpen && (() => {
        const group = appointments.find(g => g.id === expandedVisitAppointmentId);
        if (group) {
          return (
            <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <VisitPanel 
                customer={{
                  id: group.customer.id,
                  tenantId: user?.tenantId || '',
                  firstName: group.customer.firstName,
                  lastName: group.customer.lastName,
                  phone: group.customer.phone || undefined,
                  pets: Array.from(new Map(group.originalAppointments.map(a => [a.pet.id, a.pet])).values()) as any,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }}
                linkedAppointments={group.originalAppointments}
                onClose={() => {
                  setExpandedVisitAppointmentId(null);
                  loadAppointments();
                }} 
              />
            </div>
          );
        }
        return null;
      })()}

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={appointments}
          loading={loading}
          emptyIcon={CalendarDays}
          emptyText="ไม่พบรายการนัดหมาย"
          keyExtractor={(g) => g.id}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          expandedRowId={expandedVisitAppointmentId}
          renderExpandedRow={(group) => (
            expandedVisitAppointmentId === group.id ? (
              <VisitPanel 
                customer={{
                  id: group.customer.id,
                  tenantId: user?.tenantId || '',
                  firstName: group.customer.firstName,
                  lastName: group.customer.lastName,
                  phone: group.customer.phone || undefined,
                  pets: Array.from(new Map(group.originalAppointments.map(a => [a.pet.id, a.pet])).values()) as any,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }}
                linkedAppointments={group.originalAppointments}
                onClose={() => {
                  setExpandedVisitAppointmentId(null);
                  loadAppointments(); // Refresh to potentially show new status if changed
                }} 
              />
            ) : null
          )}
        />
      ) : (
        <AppointmentCalendar
          currentDate={currentMonthDate}
          onMonthChange={setCurrentMonthDate}
          appointments={appointments.flatMap(g => g.originalAppointments)}
          onDateSelect={(date) => {
            // Give user intent to explicitly create appointment on this day
            setCreateFormPrefillDate(format(date, 'yyyy-MM-dd'));
            setIsCreateFormOpen(true);
            setExpandedVisitAppointmentId(null);
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll back up to the form
          }}
          onAppointmentClick={(app) => {
            // Find the group related to this appointment
            // Avoid JS Date timezone shifting issues by extracting YYYY-MM-DD string part directly
            const dateStr = app.date.includes('T') ? app.date.split('T')[0] : format(new Date(app.date), 'yyyy-MM-dd');
            const groupId = `${app.pet.customer.id}_${dateStr}`;
            const group = appointments.find(g => g.id === groupId);

            // If the appointment group is fully completed, open the completed detailed modal directly
            if (group && group.originalAppointments.every(a => a.status === 'COMPLETED')) {
              setViewCompletedVisitGroup(group);
              setExpandedVisitAppointmentId(null);
            } else {
              // Expand that appointment in calendar mode
              setExpandedVisitAppointmentId(groupId);
            }

            setIsCreateFormOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {isRescheduleModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: brandColor + '15', color: brandColor }}
                >
                  <CalendarDays size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">เลื่อนนัดหมาย</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    เลือกสัตว์เลี้ยงที่ต้องการเลื่อนนัดของ: <strong>{selectedGroup.customer.firstName} {selectedGroup.customer.lastName}</strong>
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">สัตว์เลี้ยงในครั้งนี้</label>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {selectedGroup.originalAppointments.filter(a => a.status === 'SCHEDULED').map(app => (
                    <label key={app.id} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                        checked={selectedAppointmentIds.includes(app.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAppointmentIds(prev => [...prev, app.id]);
                          } else {
                            if (selectedAppointmentIds.length > 1) {
                              setSelectedAppointmentIds(prev => prev.filter(id => id !== app.id));
                            }
                          }
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Dog size={14} style={{ color: brandColor }} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{app.pet.name}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{app.reason}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <form onSubmit={handleReschedule} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">วันที่นัดหมายใหม่</label>
                  <ThaiDateInput
                    value={newDate}
                    onChange={val => setNewDate(val)}
                  />
                </div>
                <BrandInput
                  label="เวลา"
                  type="time"
                  required
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                />

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsRescheduleModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <BrandButton type="submit" className="rounded-xl px-6">
                    ยืนยันการเลื่อนนัด
                  </BrandButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        description={alertModal.description}
        type={alertModal.type}
        onConfirm={alertModal.onConfirm}
        confirmText={alertModal.confirmText}
      />

      {partialActionModal.isOpen && partialActionModal.group && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" 
                style={{ 
                  backgroundColor: partialActionModal.status === 'CANCELLED' ? '#FEE2E2' : '#DCFCE7', 
                  color: partialActionModal.status === 'CANCELLED' ? '#EF4444' : '#10B981' 
                }}>
                {partialActionModal.status === 'CANCELLED' ? <XCircle size={24} /> : <CheckCircle size={24} />}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                ยืนยันการ{partialActionModal.status === 'CANCELLED' ? 'ยกเลิก' : 'ทำรายการ'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                เลือกสัตว์เลี้ยงที่ต้องการเปลี่ยนสถานะนัดหมายของ: <br/><strong>{partialActionModal.group.customer.firstName} {partialActionModal.group.customer.lastName}</strong>
              </p>

              <div className="space-y-2 mb-8 max-h-40 overflow-y-auto pr-1">
                {partialActionModal.group.originalAppointments.filter(a => a.status === 'SCHEDULED').map(app => (
                  <label key={app.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-gray-300 text-brand focus:ring-brand transition-all"
                      checked={partialSelectedIds.includes(app.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPartialSelectedIds(prev => [...prev, app.id]);
                        } else {
                          setPartialSelectedIds(prev => prev.filter(id => id !== app.id));
                        }
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{app.pet.name}</span>
                      <span className="text-xs text-gray-400">{app.reason}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPartialActionModal({ ...partialActionModal, isOpen: false })}
                  className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  disabled={partialSelectedIds.length === 0}
                  onClick={async () => {
                    try {
                      await Promise.all(
                        partialSelectedIds.map(id => appointmentService.update(id, { status: partialActionModal.status! }))
                      );
                      setPartialActionModal({ ...partialActionModal, isOpen: false });
                      loadAppointments();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className={`flex-1 px-4 py-3 text-sm font-bold text-white rounded-2xl transition-all shadow-lg ${
                    partialActionModal.status === 'CANCELLED' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-brand hover:bg-brand-hover shadow-brand/20'
                  } disabled:opacity-50 disabled:shadow-none`}
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewCompletedVisitGroup && (
        <CompletedVisitDetailsModal 
          isOpen={true}
          onClose={() => setViewCompletedVisitGroup(null)}
          group={viewCompletedVisitGroup}
        />
      )}
    </div>
  );
}
