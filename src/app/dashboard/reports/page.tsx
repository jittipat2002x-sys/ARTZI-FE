'use client';

import { useState, useEffect } from 'react';
import { 
  useGetInventoryReport, 
  useGetFinanceReport, 
  useGetStatsReport 
} from '../hooks/useReports';
import { authService } from '@/services/auth.service';
import { useBranding } from '@/contexts/branding-context';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { 
  Package, DollarSign, BarChart3, TrendingUp, AlertTriangle, 
  ArrowRight, Download, Calendar, Filter, PieChart as PieIcon
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'finance' | 'stats'>('inventory');
  const [user, setUser] = useState<any>(null);
  const { brandColor } = useBranding();
  
  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const branchId = user?.branches?.[0]?.branchId;

  // Data hooks
  const { data: inventoryData, isLoading: invLoading } = useGetInventoryReport(branchId);
  const { data: financeData, isLoading: finLoading } = useGetFinanceReport(branchId, startDate, endDate);
  const { data: statsData, isLoading: statsLoading } = useGetStatsReport(branchId, startDate, endDate);

  useEffect(() => {
    const userData = authService.getUser();
    setUser(userData);
  }, []);

  const formatCurrency = (val: number) => `฿${val.toLocaleString()}`;
  
  if (!user) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">รายงานระบบ (Reports)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            วิเคราะห์ข้อมูลและสรุปผลการดำเนินงานเชิงลึก
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-inner' : 'text-gray-500'}`}
          >
            <Package size={16} className="inline mr-2" /> คลังสินค้า
          </button>
          <button 
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'finance' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-inner' : 'text-gray-500'}`}
          >
            <DollarSign size={16} className="inline mr-2" /> การเงิน
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'stats' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-inner' : 'text-gray-500'}`}
          >
            <PieIcon size={16} className="inline mr-2" /> สถิติ
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventory Overview */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
               <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                 <Package size={20} style={{ color: brandColor }} />
                 คลังสินค้าแยกตามประเภท
               </h3>
               <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryData?.byType || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                      <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <RechartsTooltip cursor={false} />
                      <Bar dataKey="_count._all" name="จำนวนรายการ" fill={brandColor} radius={[4, 4, 0, 0]} style={{ outline: 'none' }} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
               <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-600">
                 <AlertTriangle size={20} />
                 รายการสินค้าใกล้หมด
               </h3>
               <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                 {inventoryData?.lowStock?.length > 0 ? (
                   inventoryData.lowStock.map((item: any, i: number) => (
                     <div key={i} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.name}</p>
                          <p className="text-xs text-red-500">คงเหลือ: {item.quantity} (เกณฑ์: {item.lowStockThreshold})</p>
                        </div>
                        <div className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-bold shadow-sm">
                           {item.type}
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-12 text-gray-500 italic">ไม่มีรายการที่ต้องเฝ้าระวัง</div>
                 )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
               <div className="flex gap-4 items-center">
                 <Calendar size={18} className="text-gray-400" />
                 <input 
                   type="date" 
                   value={startDate} 
                   onChange={(e) => setStartDate(e.target.value)}
                   className="text-sm rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20"
                 />
                 <span className="text-gray-400">ถึง</span>
                 <input 
                   type="date" 
                   value={endDate} 
                   onChange={(e) => setEndDate(e.target.value)}
                   className="text-sm rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20"
                 />
               </div>
               <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all">
                 <Download size={16} /> Export PDF
               </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
               <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                 <DollarSign size={20} style={{ color: brandColor }} />
                 รายรับ - รายถ่าย รายวัน
               </h3>
               <div className="h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financeData || []}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={brandColor} stopOpacity={0.1}/>
                          <stop offset="95%" stopColor={brandColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <RechartsTooltip />
                      <Legend />
                      <Area type="monotone" name="รายรับ" dataKey="revenue" stroke={brandColor} fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                      <Area type="monotone" name="ต้นทุนสินค้า" dataKey="expense" stroke="#f97316" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                    </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Usage Stats */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
               <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                 <BarChart3 size={20} style={{ color: brandColor }} />
                 สถิติการใช้สินค้าประประเภทต่างๆ
               </h3>
               <div className="flex items-center justify-center h-[300px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statsData?.usageByProductType || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="type"
                        style={{ outline: 'none' }}
                      >
                        {(statsData?.usageByProductType || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-3xl font-black text-gray-900 dark:text-white">{statsData?.totalSalesItems || 0}</span>
                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Items Sold</span>
                  </div>
               </div>
            </div>

            {/* Visit stats list or common patterns */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                 <TrendingUp size={20} className="text-green-500" />
                 สถิติผู้เข้าใช้บริการรวม
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                     <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Total Visits</p>
                     <p className="text-3xl font-black text-blue-900 dark:text-blue-100">{statsData?.visitCount || 0}</p>
                  </div>
                  <div className="p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                     <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">Total Items Sold</p>
                     <p className="text-3xl font-black text-purple-900 dark:text-purple-100">{statsData?.totalSalesItems || 0}</p>
                  </div>
               </div>
               
               <div className="mt-6 space-y-4">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">ปริมาณการใช้แยกตามประเภท</p>
                  {statsData?.usageByProductType?.map((stat: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                       <p className="text-sm flex-1">{stat.type}</p>
                       <p className="text-sm font-bold">{stat.count.toLocaleString()} ชิ้น</p>
                       <p className="text-xs text-gray-400">({formatCurrency(stat.revenue)})</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
