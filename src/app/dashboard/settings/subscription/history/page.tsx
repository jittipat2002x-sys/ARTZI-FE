'use client';

import React, { useEffect, useState } from 'react';
import { tenantService } from '@/services/admin.service';
import { CreditCard, Calendar, CheckCircle, Clock, XCircle, ArrowLeft, History } from 'lucide-react';
import { useBranding } from '@/contexts/branding-context';
import Link from 'next/link';

export default function SubscriptionHistoryPage() {
  const { brandColor } = useBranding();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await tenantService.getMySubscriptions();
      setHistory(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link 
            href="/dashboard/settings/subscription"
            className="text-sm text-gray-500 hover:text-brand flex items-center gap-1 mb-2 transition-colors"
            style={{ color: brandColor }}
          >
            <ArrowLeft size={14} /> กลับไปหน้าจัดการแพ็กเกจ
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="h-8 w-8 text-brand" style={{ color: brandColor }} /> ประวัติการชำระเงิน
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">ตรวจสอบรายการชำระเงินและประวัติแพ็กเกจทั้งหมดของคุณ</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">แพ็กเกจ</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ช่วงเวลา</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ยอดเงิน</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่ชำระ</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center" style={{ backgroundColor: `${brandColor}15` }}>
                        <CreditCard className="h-4 w-4 text-brand" style={{ color: brandColor }} />
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{item.planName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(item.startDate).toLocaleDateString('th-TH')} - {new Date(item.endDate).toLocaleDateString('th-TH')}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    ฿{item.amountPaid.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString('th-TH', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                      item.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.paymentStatus === 'PAID' ? <><CheckCircle size={10} /> ชำระแล้ว</> :
                       item.paymentStatus === 'PENDING' ? <><Clock size={10} /> รอการยืนยัน</> : 
                       <><XCircle size={10} /> ล้มเหลว</>}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>ไม่พบประวัติการชำระเงิน</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
