'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { useGetDashboardSummary } from './hooks/useDashboard';
import { useBranding } from '@/contexts/branding-context';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
} from 'recharts';
import { 
  TrendingUp, Users, Calendar, Activity, DollarSign, Package,
  ArrowUpRight, ArrowDownRight, ActivitySquare
} from 'lucide-react';
import { ThaiDateInput } from '@/components/ui/thai-date-input';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const { brandColor } = useBranding();
  
  // Date filters
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const branchId = user?.branches?.[0]?.branchId;
  const { data, isLoading, error } = useGetDashboardSummary(branchId, startDate, endDate);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const userData = authService.getUser();
    if (!userData) {
      router.push('/login');
      return;
    }

    setUser(userData);
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-brand animate-spin" style={{ borderTopColor: brandColor }}></div>
        <div className="flex flex-col items-center animate-pulse">
           <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-full mb-2"></div>
           <div className="h-3 w-48 bg-gray-100 dark:bg-gray-900 rounded-full opacity-60"></div>
        </div>
      </div>
    );
  }

  // Formatting helpers
  const formatCurrency = (val: number) => `฿${val.toLocaleString()}`;
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl text-xs">
          <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="flex justify-between gap-4 py-0.5" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="font-bold">
                {entry.name.includes('รายรับ') || entry.name.includes('รายจ่าย') 
                  ? formatCurrency(entry.value) 
                  : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">แดชบอร์ดสรุปผลการดำเนินงาน</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ภาพรวมคลินิกสัตวแพทย์ของคุณ
          </p>
        </div>
        
        {/* Date Filters */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-none">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 pl-2">ตั้งแต่:</span>
            <ThaiDateInput
              value={startDate}
              onChange={(val) => setStartDate(val)}
              className="min-w-[150px]"
            />
          </div>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">ถึง:</span>
            <ThaiDateInput
              value={endDate}
              onChange={(val) => setEndDate(val)}
              className="min-w-[150px]"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {/* Skeletons for Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 h-32 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700"></div>
                  <div className="h-4 w-24 bg-gray-100 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="h-8 w-32 bg-gray-100 dark:bg-gray-700 rounded mt-2"></div>
                <div className="h-3 w-20 bg-gray-50 dark:bg-gray-900 rounded"></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart Skeleton */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 lg:col-span-2 h-[380px]">
              <div className="h-6 w-48 bg-gray-100 dark:bg-gray-700 rounded mb-8"></div>
              <div className="w-full h-[280px] bg-gray-50 dark:bg-gray-900/50 rounded-xl relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-around px-4">
                   {[1, 2, 3, 4, 5, 6].map(i => (
                     <div key={i} className="w-8 bg-gray-100/50 dark:bg-gray-800/50 rounded-t" style={{ height: `${20 + Math.random() * 60}%` }}></div>
                   ))}
                </div>
              </div>
            </div>

            {/* Right Side Skeletons */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 h-[210px]">
                <div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded mb-6"></div>
                <div className="flex items-end gap-2 h-[120px]">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="flex-1 bg-gray-100/40 dark:bg-gray-800/40 rounded-t" style={{ height: `${30 + Math.random() * 60}%` }}></div>
                   ))}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="h-4 w-40 bg-gray-100 dark:bg-gray-700 rounded mb-6"></div>
                <div className="space-y-4">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700"></div>
                           <div className="space-y-2">
                             <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded"></div>
                             <div className="h-2 w-16 bg-gray-50 dark:bg-gray-800 rounded"></div>
                           </div>
                        </div>
                        <div className="h-4 w-12 bg-gray-100 dark:bg-gray-700 rounded"></div>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center border border-red-100">
           เกิดข้อผิดพลาดในการโหลดข้อมูล
        </div>
      ) : (
        <>
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue Card */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <DollarSign size={80} />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">รายรับรวม</h3>
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white" style={{ color: brandColor }}>
                {formatCurrency(data?.summary.totalRevenue || 0)}
              </p>
              <div className="mt-3 text-xs flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                <ArrowUpRight size={14} /> <span>ทั้งหมดช่วงเวลาที่เลือก</span>
              </div>
            </div>

            {/* Expenses Card */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ActivitySquare size={80} />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                  <Activity size={20} />
                </div>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">ต้นทุนรวม (สินค้า)</h3>
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white text-orange-600 dark:text-orange-400">
                {formatCurrency(data?.summary.totalExpenses || 0)}
              </p>
              <div className="mt-3 text-xs flex items-center gap-1 text-gray-500 dark:text-gray-400">
                 <span>กำไรเบื้องต้น: {formatCurrency(data?.summary.profit || 0)}</span>
              </div>
            </div>

            {/* Visits Card */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users size={80} />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  <Users size={20} />
                </div>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">จำนวนการเข้ารักษา</h3>
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white">
                {(data?.summary.totalVisits || 0).toLocaleString()} <span className="text-base font-normal text-gray-500">ครั้ง</span>
              </p>
              <div className="mt-3 text-xs flex items-center gap-1 text-gray-500 dark:text-gray-400">
                 <span>จำนวน Visit ในระบบ</span>
              </div>
            </div>

            {/* Appointments Card */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Calendar size={80} />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                  <Calendar size={20} />
                </div>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">การนัดหมายทั้งหมด</h3>
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white">
                {(data?.summary.totalAppointments || 0).toLocaleString()} <span className="text-base font-normal text-gray-500">ครั้ง</span>
              </p>
              <div className="mt-3 text-xs flex items-center gap-1 text-gray-500 dark:text-gray-400">
                 <span>มีการสร้างนัดหมายในช่วงเวลานี้</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart - Financials */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-none lg:col-span-2">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   <TrendingUp size={18} style={{ color: brandColor }} />
                   แนวโน้มรายรับ - ต้นทุน (Revenue vs Cost)
                 </h3>
               </div>
               
               <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={data?.chartData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                     <XAxis 
                       dataKey="date" 
                       tickFormatter={formatDate}
                       axisLine={false}
                       tickLine={false}
                       tick={{ fontSize: 12, fill: '#6B7280' }}
                       dy={10}
                     />
                     <YAxis 
                       axisLine={false}
                       tickLine={false}
                       tick={{ fontSize: 12, fill: '#6B7280' }}
                       tickFormatter={(value) => `฿${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                     />
                     <RechartsTooltip content={<CustomTooltip />} />
                     <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                     <Line 
                       type="monotone" 
                       name="รายรับรวม" 
                       dataKey="revenue" 
                       stroke={brandColor} 
                       strokeWidth={3}
                       dot={false}
                       activeDot={{ r: 6, strokeWidth: 0, fill: brandColor }}
                     />
                     <Line 
                       type="monotone" 
                       name="ต้นทุนสินค้า" 
                       dataKey="expense" 
                       stroke="#F97316" 
                       strokeWidth={2}
                       dot={false}
                       activeDot={{ r: 4, strokeWidth: 0, fill: '#F97316' }}
                     />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Top Items & Secondary Chart */}
            <div className="space-y-6">
              {/* Traffic Chart */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-none">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" />
                    จำนวนผู้เข้าใช้บริการ (Visits / Day)
                  </h3>
                </div>
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.chartData || []} margin={{ top: 5, right: 0, bottom: 0, left: -25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                      <XAxis dataKey="date" hide />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                      <Bar 
                        dataKey="visits" 
                        name="จำนวนครั้ง" 
                        fill="#3B82F6" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                        style={{ outline: 'none' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Selling Items */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-none">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package size={16} style={{ color: brandColor }} />
                    สินค้า/บริการ ยอดนิยม
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {data?.topItems && data.topItems.length > 0 ? (
                    data.topItems.map((item, index) => (
                      <div key={item.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center font-bold text-xs border border-gray-200 dark:border-gray-700 shadow-none" style={{ color: brandColor }}>
                            #{index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{item.name}</p>
                            <p className="text-[10px] text-gray-500 font-medium">{item.quantity} รายการ (ขายแล้ว)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm" style={{ color: brandColor }}>{formatCurrency(item.revenue)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-sm text-gray-500 italic">ไม่มีข้อมูลการขายในช่วงเวลานี้</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
