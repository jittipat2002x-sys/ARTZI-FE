'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CreditCard, Package, CheckCircle2, Clock, AlertCircle, Upload, Check, QrCode, Copy, History } from 'lucide-react';
import { tenantService } from '@/services/admin.service';
import { useBranding } from '@/contexts/branding-context';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { generatePromptPayPayload } from '@/utils/promptpay';
import { cn } from '@/lib/utils';

export default function SubscriptionPage() {
  const { brandColor } = useBranding();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [slip, setSlip] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PROMPTPAY_ID = '0812345678'; // Placeholder, ideally from config/tenant
  const PAYMENT_AMOUNT = 990;
  const qrPayload = generatePromptPayPayload(PROMPTPAY_ID, PAYMENT_AMOUNT);

  useEffect(() => {
    fetchTenant();
  }, []);

  const fetchTenant = async () => {
    try {
      const data = await tenantService.getMe();
      setTenant(data);
    } catch (e) {
      console.error('Failed to fetch tenant:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSlip(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRenewal = async () => {
    if (!slip) return;
    setSubmitting(true);
    try {
      await tenantService.submitRenewal({ paymentSlipUrl: slip });
      await fetchTenant();
      setSlip(null);
      alert('ส่งหลักฐานการโอนเงินเรียบร้อยแล้ว รอเจ้าหน้าที่ตรวจสอบครับ');
    } catch (e: any) {
      alert(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;

  const isRenewPending = tenant?.status === 'RENEW_PENDING';

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full p-6 pb-32">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
            <CreditCard size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">จัดการการใช้งาน (Subscription)</h1>
            <p className="text-sm text-gray-500">ตรวจสอบและต่ออายุการใช้งานคลินิกของคุณ</p>
          </div>
        </div>
        
        <Link 
          href="/dashboard/settings/subscription/history"
          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-bold transition-all border border-gray-200 dark:border-gray-700 shadow-none text-sm"
        >
          <History size={20} className="text-brand" style={{ color: brandColor }} />
          <span>ประวัติการชำระเงิน</span>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Status Card */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-300 dark:border-gray-700/50 shadow-none flex flex-col justify-between">
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">แผนปัจจุบันของคุณ</p>
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black text-brand" style={{ color: brandColor }}>{tenant?.activePlan || 'FREE'}</span>
                <div className="flex flex-col gap-1">
                  {tenant?.isActive ? (
                    <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black rounded-full flex items-center gap-1.5 border border-green-100 dark:border-green-800/50 uppercase tracking-wider">
                      <CheckCircle2 size={12} /> ใช้งานอยู่ (Active)
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black rounded-full flex items-center gap-1.5 border border-red-100 dark:border-red-800/50 uppercase tracking-wider">
                      <AlertCircle size={12} /> หมดอายุ (Expired)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-right">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">หมดอายุเมื่อ</p>
              <p className="text-lg font-black text-gray-900 dark:text-white">
                {tenant?.planExpiresAt ? new Date(tenant.planExpiresAt).toLocaleDateString('th-TH', { dateStyle: 'long' }) : 'ไม่มีกำหนด'}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-auto">
            <div className="flex items-center gap-4 p-5 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-brand/20 transition-all">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-none border border-gray-100 dark:border-gray-700">
                <Package className="text-brand" style={{ color: brandColor }} size={24} />
              </div>
              <div>
                <p className="font-black text-gray-900 dark:text-white text-sm">ฟีเจอร์พื้นฐานครบครัน</p>
                <p className="text-xs text-gray-500">จัดการสาขา, ประวัติการรักษา, แล็บเทส</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-brand/20 transition-all">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-none border border-gray-100 dark:border-gray-700">
                <Package className="text-brand" style={{ color: brandColor }} size={24} />
              </div>
              <div>
                <p className="font-black text-gray-900 dark:text-white text-sm">การสนับสนุน</p>
                <p className="text-xs text-gray-500">ทีมงานพร้อมดูแลผ่าน LINE @antigravity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-300 dark:border-gray-700/50 shadow-none flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 -mr-8 -mt-8 bg-brand/5 rounded-full blur-3xl group-hover:bg-brand/10 transition-all" style={{ backgroundColor: brandColor + '10' }} />
          
          {isRenewPending ? (
            <>
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-none border border-blue-100 dark:border-blue-800">
                <Clock size={40} className="animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">อยู่ระหว่างตรวจสอบ</h3>
              <p className="text-xs text-gray-500 max-w-[180px] leading-relaxed">เราได้รับหลักฐานการโอนเงินแล้ว กำลังดำเนินการอนุมัติภายใน 24 ชม.</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-brand/5 text-brand rounded-3xl flex items-center justify-center mb-6 shadow-none border border-brand/10" style={{ backgroundColor: brandColor + '10', color: brandColor, borderColor: brandColor + '20' }}>
                <CreditCard size={40} />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">ต่ออายุรายเดือน</h3>
              <p className="text-xl font-black text-gray-900 dark:text-white mb-6">฿{(990).toLocaleString()}<span className="text-xs text-gray-400 font-bold">/เดือน</span></p>
              
              <div className="w-full space-y-3">
                <button
                  onClick={() => setShowQr(true)}
                  className="w-full py-3.5 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 border-2 border-gray-100 dark:border-gray-800 rounded-2xl font-black text-xs hover:border-brand hover:bg-white dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-brand/5"
                  style={{ borderStyle: 'solid' }}
                >
                  <QrCode size={18} /> สแกนจ่าย (Scan to Pay)
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">หรือ</span>
                  <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "w-full p-4 border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center gap-2 group/upload",
                    slip 
                      ? "border-brand/40 bg-brand/5" 
                      : "border-gray-100 dark:border-gray-800 hover:border-brand/30 hover:bg-brand/[0.02]"
                  )}
                  style={slip ? { borderColor: brandColor + '60', backgroundColor: brandColor + '05' } : {}}
                >
                  <div className={cn(
                    "p-2 rounded-xl transition-all",
                    slip ? "bg-brand text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover/upload:text-brand"
                  )} style={slip ? { backgroundColor: brandColor } : {}}>
                    <Upload size={18} />
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {slip ? 'เปลี่ยนสลิป' : 'อัปโหลดสลิปโอนเงิน'}
                  </span>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleSlipUpload} />
                
                {slip && (
                  <button
                    disabled={submitting}
                    onClick={handleSubmitRenewal}
                    className="w-full py-4 text-white rounded-2xl font-black text-xs hover:scale-[1.02] active:scale-95 shadow-xl transition-all flex items-center justify-center gap-2 mt-2 animate-in zoom-in-95"
                    style={{ backgroundColor: brandColor, boxShadow: `${brandColor}33 0px 8px 24px` }}
                  >
                    {submitting ? 'กำลังส่ง...' : <><CheckCircle2 size={18} /> ยืนยันการส่งสลิป</>}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-300 dark:border-gray-700/50 shadow-none overflow-hidden relative">
       
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-8 flex items-center gap-2">
           ข้อมูลการชำระเงิน <span className="text-xs text-gray-400 font-normal opacity-50">• โอนผ่านธนาคาร</span>
        </h2>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between p-5 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">ธนาคาร</span>
              <div className="text-right">
                <span className="font-black text-gray-900 dark:text-white">ธนาคารกสิกรไทย (KBank)</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-5 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-100 group/item">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">เลขที่บัญชี</span>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-gray-900 dark:text-white tracking-wider">123-4-56789-0</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText('1234567890');
                    alert('คัดลอกเลขบัญชีแล้ว');
                  }}
                  className="p-2.5 bg-white dark:bg-gray-800 text-gray-400 hover:text-brand hover:scale-110 active:scale-95 rounded-xl border border-gray-200 dark:border-gray-700 shadow-none transition-all"
                  title="คัดลอก"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-5 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">ชื่อบัญชี</span>
              <span className="font-black text-gray-900 dark:text-white">บจก. แอนตี้กราวิตี้ ซอฟต์แวร์</span>
            </div>
          </div>

          <div className="bg-brand/[0.03] border border-brand/10 rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden" style={{ borderColor: brandColor + '20' }}>
            <div className="absolute -right-4 -bottom-4 text-brand opacity-5 rotate-12" style={{ color: brandColor }}>
                <AlertCircle size={100} />
            </div>
            <div className="flex items-center gap-2 text-brand font-black text-xs uppercase tracking-widest" style={{ color: brandColor }}>
                <AlertCircle size={16} /> หมายเหตุสำคัญ
            </div>
            <ul className="space-y-3 relative z-10">
              {[
                'หลังจากโอนเงินแล้ว กรุณาอัปโหลดสลิปเพื่อขออนุมัติ',
                'เจ้าหน้าที่จะตรวจสอบข้อมูลภายใน 24 ชั่วโมง',
                'กรณีเร่งด่วน ติดต่อผ่าน LINE @antigravity ได้ทันที'
              ].map((text, idx) => (
                <li key={idx} className="flex gap-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-bold">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand shrink-0 mt-1.5" style={{ backgroundColor: brandColor }} />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setShowQr(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <CheckCircle2 size={24} className="rotate-45" />
            </button>
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/PromptPay-logo.png" alt="PromptPay" className="h-8 object-contain" />
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 mb-6 flex justify-center">
                <QRCodeSVG value={qrPayload} size={200} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">฿{PAYMENT_AMOUNT.toLocaleString()}</h3>
              <p className="text-sm text-gray-500 mb-6 font-medium">สแกนเพื่อต่ออายุการใช้งาน</p>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 text-[10px] text-left">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-gray-400 uppercase font-bold">ธนาคาร</p>
                    <p className="font-bold text-gray-900 dark:text-white">กสิกรไทย (KBank)</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-400 uppercase font-bold">ชื่อบัญชี</p>
                    <p className="font-bold text-gray-900 dark:text-white text-right">บจก. แอนตี้กราวิตี้ ซอฟต์แวร์</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQr(false)}
                  className="w-full py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition-all"
                  style={{ backgroundColor: brandColor }}
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
