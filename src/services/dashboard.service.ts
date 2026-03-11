import { apiClient as api } from '@/lib/api-client';

export interface DashboardSummary {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    totalVisits: number;
    totalAppointments: number;
  };
  chartData: {
    date: string;
    revenue: number;
    expense: number;
    visits: number;
  }[];
  topItems: {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

export const dashboardService = {
  getSummary: async (branchId?: string, startDate?: string, endDate?: string): Promise<DashboardSummary> => {
    let url = `/dashboard/summary`;
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await api.get(url);
    return response.data as DashboardSummary;
  },

  getInventoryReport: async (branchId?: string): Promise<any> => {
    const url = `/reports/inventory${branchId ? `?branchId=${branchId}` : ''}`;
    const response = await api.get(url);
    return response.data as any;
  },

  getFinanceReport: async (branchId?: string, startDate?: string, endDate?: string): Promise<any[]> => {
    let url = `/reports/finance`;
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await api.get(url);
    return response.data as any[];
  },

  getStatsReport: async (branchId?: string, startDate?: string, endDate?: string): Promise<any> => {
    let url = `/reports/stats`;
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await api.get(url);
    return response.data as any;
  }
};
