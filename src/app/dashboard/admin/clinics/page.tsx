'use client';

import React, { useEffect, useState } from 'react';
import { tenantService } from '@/services/admin.service';
import { CheckCircle, XCircle, Eye, Building2, Search, Clock, AlertTriangle, History } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Modal, AlertModal } from '@/components/ui/modal';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandTextarea } from '@/components/ui/brand-textarea';
import { Pagination } from '@/components/ui/pagination';
import { ThaiDateInput } from '@/components/ui/thai-date-input';

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  
  // New modal states
  const [approveConfirmId, setApproveConfirmId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveExpiry, setApproveExpiry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [clinicHistory, setClinicHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchClinics = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await tenantService.getAll(undefined, page, 10, search);
      setClinics(res.data || []);
      setTotalPages(res.meta?.lastPage || 1);
      setCurrentPage(page);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClinics(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (selectedClinic) {
      fetchClinicHistory(selectedClinic.id);
    } else {
      setClinicHistory([]);
    }
  }, [selectedClinic]);

  const fetchClinicHistory = async (id: string) => {
    setLoadingHistory(true);
    try {
      const data = await tenantService.getSubscriptionsById(id);
      setClinicHistory(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleApprove = async () => {
    if (!approveConfirmId) return;
    setIsSubmitting(true);
    try {
      await tenantService.updateStatus(approveConfirmId, { 
        status: 'APPROVED',
        planExpiresAt: approveExpiry || undefined
      });
      setApproveConfirmId(null);
      setApproveExpiry('');
      setSelectedClinic(null);
      fetchClinics();
    } catch (e: any) { alert(e.message); }
    finally { setIsSubmitting(false); }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setIsSubmitting(true);
    try {
      await tenantService.updateStatus(rejectId, { status: 'REJECTED', reason: rejectReason });
      setRejectId(null);
      setRejectReason('');
      setSelectedClinic(null);
      fetchClinics();
    } catch (e: any) { alert(e.message); }
    finally { setIsSubmitting(false); }
  };

  const filtered = clinics; // Filtering now happens on the backend

  const SubscriptionForm = ({ clinic }: { clinic: any }) => {
    const [plan, setPlan] = useState(clinic.activePlan || 'FREE');
    const [expiry, setExpiry] = useState(clinic.planExpiresAt ? new Date(clinic.planExpiresAt).toISOString().split('T')[0] : '');
    const [updating, setUpdating] = useState(false);

    const handleUpdateSubscription = async () => {
      setUpdating(true);
      try {
        await tenantService.updateStatus(clinic.id, { 
          status: clinic.status,
          activePlan: plan,
          planExpiresAt: expiry || undefined
        });
        alert('อัปเดตข้อมูลการใช้งานเรียบร้อยแล้ว');
        fetchClinics();
        setSelectedClinic(null);
      } catch (e: any) {
        alert(e.message);
      } finally {
        setUpdating(false);
      }
    };

    return (
      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600 mt-6">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand" /> จัดการข้อมูลการใช้งาน (Subscription)
        </h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">แพ็กเกจ</label>
            <select 
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all text-sm"
            >
              <option value="FREE">FREE</option>
              <option value="BASIC">BASIC</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
          </div>
          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-1">วันหมดอายุ</label>
            <ThaiDateInput
              value={expiry}
              onChange={(val) => setExpiry(val)}
            />
          </div>
        </div>
        <BrandButton 
          onClick={handleUpdateSubscription}
          disabled={updating}
          className="w-full"
        >
          {updating ? 'กำลังบันทึก...' : 'อัปเดตข้อมูลการใช้งาน'}
        </BrandButton>
      </div>
    );
  };

  const HistorySection = () => {
    if (loadingHistory) return <div className="text-center py-4 text-gray-400 text-sm">กำลังโหลดประวัติ...</div>;
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 mt-6">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-brand" /> ประวัติการชำระเงิน
        </h4>
        <div className="space-y-3">
          {clinicHistory.map((sub: any) => (
            <div key={sub.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 text-sm">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{sub.planName}</p>
                <p className="text-[10px] text-gray-500 uppercase">
                  {new Date(sub.startDate).toLocaleDateString('th-TH')} - {new Date(sub.endDate).toLocaleDateString('th-TH')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand">฿{sub.amountPaid.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">{new Date(sub.createdAt).toLocaleDateString('th-TH')}</p>
              </div>
            </div>
          ))}
          {clinicHistory.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-xs italic">ไม่มีข้อมูลประวัติการชำระเงิน</div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>;

  return (
    <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 p-7 rounded-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="h-8 w-8 text-brand" /> ตรวจสอบและอนุมัติคลินิก
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">จัดการคำขอเปิดใช้งานระบบและตรวจสอบหลักฐานการชำระเงิน</p>
      </div>

      <div className="mb-6">
        <Input
          icon={Search}
          placeholder="ค้นหาชื่อคลินิก หรืออีเมล..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((clinic) => {
          const isExpired = clinic.planExpiresAt && new Date(clinic.planExpiresAt) < new Date();
          return (
            <div key={clinic.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-brand" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      clinic.status === 'APPROVED' ? 'bg-brand/10 text-brand' :
                      clinic.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      clinic.status === 'RENEW_PENDING' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {clinic.status === 'APPROVED' ? 'อนุมัติแล้ว' :
                       clinic.status === 'REJECTED' ? 'ไม่อนุมัติ' : 
                       clinic.status === 'RENEW_PENDING' ? 'รอต่ออายุ' : 'รอการตรวจสอบ'}
                    </span>
                    {clinic.status === 'APPROVED' && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isExpired ? 'bg-red-100 text-red-600' : 'bg-brand/10 text-brand'
                      }`}>
                        {clinic.activePlan} {isExpired ? '(หมดอายุ)' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{clinic.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{clinic.email}</p>
                
                <div className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> สมัครเมื่อ: {new Date(clinic.createdAt).toLocaleDateString('th-TH')}
                  </div>
                  {clinic.status === 'APPROVED' && (
                    <div className={`flex items-center gap-2 font-medium ${isExpired ? 'text-red-600' : ''}`}>
                      <Clock className="h-4 w-4" /> 
                      {clinic.planExpiresAt 
                        ? `หมดอายุ: ${new Date(clinic.planExpiresAt).toLocaleDateString('th-TH')}`
                        : 'ไม่มีวันหมดอายุ'}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedClinic(clinic)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-medium transition-colors border border-gray-200 dark:border-gray-600"
                  >
                    <Eye className="h-4 w-4" /> รายละเอียด
                  </button>
                  {(clinic.status === 'PENDING' || clinic.status === 'RENEW_PENDING') && (
                    <>
                      <button 
                        onClick={() => setApproveConfirmId(clinic.id)}
                        className={`inline-flex items-center justify-center p-2 rounded-lg border transition-colors ${
                          clinic.status === 'RENEW_PENDING' ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' : 'bg-brand/10 text-brand border-brand/20 hover:bg-brand/20'
                        }`}
                        title={clinic.status === 'RENEW_PENDING' ? 'อนุมัติต่ออายุ' : 'อนุมัติ'}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => setRejectId(clinic.id)}
                        className="inline-flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            ไม่พบรายการคลินิก
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            fetchClinics(page);
          }}
        />
      </div>

      <Modal 
        isOpen={!!selectedClinic} 
        onClose={() => setSelectedClinic(null)}
        className="max-w-2xl"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
          <h2 className="text-xl font-bold dark:text-white">รายละเอียดคลินิก</h2>
        </div>
        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          {selectedClinic && (
            <>
              <div className="grid grid-cols-2 gap-6 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">ชื่อคลินิก</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedClinic.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">อีเมลติดต่อ</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedClinic.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">เบอร์โทรศัพท์</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedClinic.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">เลขประจำตัวผู้เสียภาษี</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedClinic.taxId || '-'}</p>
                </div>
              </div>

              <HistorySection />
              
              {selectedClinic.status === 'APPROVED' && (
                <SubscriptionForm clinic={selectedClinic} />
              )}

              <div>
                <p className="text-sm text-gray-900 dark:text-white mb-3 font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                  หลักฐานการชำระเงิน
                </p>
                {selectedClinic.paymentSlipUrl ? (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-700 flex items-center justify-center min-h-[300px]">
                    <img src={selectedClinic.paymentSlipUrl} alt="Slip" className="max-w-full h-auto" />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-gray-400 dark:text-gray-500">
                    ไม่พบหลักฐานการโอนเงิน
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                {selectedClinic.status === 'PENDING' ? (
                  <>
                    <BrandButton 
                      onClick={() => setApproveConfirmId(selectedClinic.id)}
                      className="flex-1 rounded-xl shadow-lg"
                    >
                      อนุมัติการใช้งาน
                    </BrandButton>
                    <button 
                      onClick={() => setRejectId(selectedClinic.id)}
                      className="flex-1 border border-red-200 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors"
                    >
                      ปฏิเสธและแจ้งเหตุผล
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setSelectedClinic(null)}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                  >
                    ปิดหน้าต่าง
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Confirmation Modals */}
      <Modal
        isOpen={!!approveConfirmId}
        onClose={() => setApproveConfirmId(null)}
        className="max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-brand">
            <div className="bg-brand/10 p-2 rounded-full">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">ยืนยันการอนุมัติ</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            กรุณากำหนดวันหมดอายุการใช้งานสำหรับคลินิกนี้ (ระบบจะเริ่มต้นที่ 30 วันจากวันนี้โดยอัตโนมัติหากไม่ระบุ)
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">วันหมดอายุ (Expiry Date)</label>
              <ThaiDateInput
                value={approveExpiry}
                onChange={(val) => setApproveExpiry(val)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setApproveConfirmId(null)}
              className="flex-1 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              ยกเลิก
            </button>
            <BrandButton
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันอนุมัติ'}
            </BrandButton>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!rejectId}
        onClose={() => { setRejectId(null); setRejectReason(''); }}
        className="max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">ปฏิเสธการอนุมัติ</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            โปรดระบุเหตุผลที่ไม่อนุมัติคลินิกนี้ เพื่อแจ้งให้เจ้าของคลินิกทราบ
          </p>
          <BrandTextarea
            placeholder="ระบุเหตุผลที่นี่..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => { setRejectId(null); setRejectReason(''); }}
              className="flex-1 py-2 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleReject}
              disabled={isSubmitting || !rejectReason.trim()}
              className="flex-1 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันปฏิเสธ'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
